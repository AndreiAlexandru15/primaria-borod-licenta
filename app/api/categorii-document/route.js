/**
 * API pentru gestionarea categoriilor de fișiere
 * @fileoverview CRUD pentru categorii de fișiere pentru organizarea documentelor
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function pentru serializarea BigInt
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// GET - Listează categoriile de fișiere
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const where = {}
    if (active === 'true') {
      where.active = true
    }

    const categorii = await prisma.categorieDocument.findMany({
      where,
      include: {
        fisiere: {
          select: {
            id: true
          }
        },
        confidentialitateDefault: {
          select: {
            id: true,
            cod: true,
            denumire: true
          }
        }
      },
      orderBy: {
        nume: 'asc'
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: categorii.map(categorie => ({
        ...categorie,
        _count: {
          fisiere: categorie.fisiere?.length || 0
        },
        fisiere: undefined // Eliminăm array-ul, păstrăm doar count-ul
      }))
    }))

  } catch (error) {
    console.error('Eroare la listarea categoriilor de fișiere:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-au putut lista categoriile de fișiere',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Creează categorie de fișier nouă
export async function POST(request) {
  try {
    const body = await request.json()
    const { nume, descriere, cod, perioadaRetentie, active = true, confidentialitateDefaultId } = body

    // Validări
    if (!nume || !cod) {
      return NextResponse.json(
        { success: false, error: 'Numele și codul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică duplicatul de cod
    const existaCategorie = await prisma.categorieDocument.findFirst({
      where: {
        cod: cod.toUpperCase()
      }
    })

    if (existaCategorie) {
      return NextResponse.json(
        { success: false, error: 'O categorie cu acest cod există deja' },
        { status: 409 }
      )
    }

    // Validare perioada de retenție
    if (perioadaRetentie && (perioadaRetentie < 1 || perioadaRetentie > 100)) {
      return NextResponse.json(
        { success: false, error: 'Perioada de retenție trebuie să fie între 1 și 100 de ani' },
        { status: 400 }
      )
    }

    // Verifică dacă nivelul de confidențialitate există
    if (confidentialitateDefaultId) {
      const confidentialitate = await prisma.confidentialitateDocument.findUnique({
        where: { id: confidentialitateDefaultId }
      })
      if (!confidentialitate) {
        return NextResponse.json(
          { success: false, error: 'Nivelul de confidențialitate specificat nu există' },
          { status: 400 }
        )
      }
    }

    const categorieNoua = await prisma.categorieDocument.create({
      data: {
        nume: nume.trim(),
        descriere: descriere?.trim() || null,
        cod: cod.toUpperCase().trim(),
        perioadaRetentie: perioadaRetentie || null,
        active,
        confidentialitateDefaultId: confidentialitateDefaultId || null
      },
      include: {
        confidentialitateDefault: {
          select: {
            id: true,
            cod: true,
            denumire: true
          }
        }
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: categorieNoua,
      message: 'Categoria de fișier a fost creată cu succes'
    }))

  } catch (error) {
    console.error('Eroare la crearea categoriei de fișier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut crea categoria de fișier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizează categorie de fișier
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, nume, descriere, cod, perioadaRetentie, active, confidentialitateDefaultId } = body

    // Validări
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul categoriei este obligatoriu' },
        { status: 400 }
      )
    }

    if (!nume || !cod) {
      return NextResponse.json(
        { success: false, error: 'Numele și codul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică dacă categoria există
    const categorieExistenta = await prisma.categorieDocument.findUnique({
      where: { id }
    })

    if (!categorieExistenta) {
      return NextResponse.json(
        { success: false, error: 'Categoria specificată nu există' },
        { status: 404 }
      )
    }

    // Verifică duplicatul de cod (exclus categoria curentă)
    const existaAltaCategorie = await prisma.categorieDocument.findFirst({
      where: {
        cod: cod.toUpperCase(),
        NOT: { id }
      }
    })

    if (existaAltaCategorie) {
      return NextResponse.json(
        { success: false, error: 'O altă categorie cu acest cod există deja' },
        { status: 409 }
      )
    }

    // Validare perioada de retenție
    if (perioadaRetentie && (perioadaRetentie < 1 || perioadaRetentie > 100)) {
      return NextResponse.json(
        { success: false, error: 'Perioada de retenție trebuie să fie între 1 și 100 de ani' },
        { status: 400 }
      )
    }

    // Verifică dacă nivelul de confidențialitate există
    if (confidentialitateDefaultId) {
      const confidentialitate = await prisma.confidentialitateDocument.findUnique({
        where: { id: confidentialitateDefaultId }
      })
      if (!confidentialitate) {
        return NextResponse.json(
          { success: false, error: 'Nivelul de confidențialitate specificat nu există' },
          { status: 400 }
        )
      }
    }

    const categorieActualizata = await prisma.categorieDocument.update({
      where: { id },
      data: {
        nume: nume.trim(),
        descriere: descriere?.trim() || null,
        cod: cod.toUpperCase().trim(),
        perioadaRetentie: perioadaRetentie || null,
        active: active !== undefined ? active : true,
        confidentialitateDefaultId: confidentialitateDefaultId || null
      },
      include: {
        confidentialitateDefault: {
          select: {
            id: true,
            cod: true,
            denumire: true
          }
        }
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: categorieActualizata,
      message: 'Categoria de fișier a fost actualizată cu succes'
    }))

  } catch (error) {
    console.error('Eroare la actualizarea categoriei de fișier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza categoria de fișier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Șterge categorie de fișier
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul categoriei este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă categoria există
    const categorieExistenta = await prisma.categorieDocument.findUnique({
      where: { id },
      include: {
        fisiere: {
          select: { id: true }
        }
      }
    })

    if (!categorieExistenta) {
      return NextResponse.json(
        { success: false, error: 'Categoria specificată nu există' },
        { status: 404 }
      )
    }

    // Verifică dacă categoria are fișiere asociate
    if (categorieExistenta.fisiere && categorieExistenta.fisiere.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Nu se poate șterge categoria. Există ${categorieExistenta.fisiere.length} fișiere asociate.`,
          details: 'Ștergeți sau mutați fișierele în altă categorie înainte de a șterge categoria.'
        },
        { status: 409 }
      )
    }

    await prisma.categorieDocument.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Categoria de fișier a fost ștearsă cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea categoriei de fișier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut șterge categoria de fișier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PATCH - Actualizează status activ/inactiv
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, active } = body

    // Validări
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul categoriei este obligatoriu' },
        { status: 400 }
      )
    }

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Statusul active trebuie să fie boolean' },
        { status: 400 }
      )
    }

    // Verifică dacă categoria există
    const categorieExistenta = await prisma.categorieDocument.findUnique({
      where: { id }
    })

    if (!categorieExistenta) {
      return NextResponse.json(
        { success: false, error: 'Categoria specificată nu există' },
        { status: 404 }
      )
    }

    const categorieActualizata = await prisma.categorieDocument.update({
      where: { id },
      data: { active },
      include: {
        confidentialitateDefault: {
          select: {
            id: true,
            cod: true,
            denumire: true
          }
        }
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: categorieActualizata,
      message: `Categoria a fost ${active ? 'activată' : 'dezactivată'} cu succes`
    }))

  } catch (error) {
    console.error('Eroare la actualizarea statusului categoriei:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza statusul categoriei',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}