/**
 * API pentru gestionarea nivelurilor de confidențialitate pentru documente
 * @fileoverview CRUD pentru nivelurile de confidențialitate ale documentelor
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function pentru serializarea BigInt
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// GET - Listează nivelurile de confidențialitate
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const activ = searchParams.get('activ')

    const where = {}
    if (activ === 'true') {
      where.activ = true
    }

    const confidentialitati = await prisma.confidentialitateDocument.findMany({
      where,
      orderBy: {
        denumire: 'asc'
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: confidentialitati
    }))

  } catch (error) {
    console.error('Eroare la listarea nivelurilor de confidențialitate:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-au putut lista nivelurile de confidențialitate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Creează nivel de confidențialitate nou
export async function POST(request) {
  try {
    const body = await request.json()
    const { cod, denumire, descriere, activ = true } = body

    // Validări
    if (!denumire || !cod) {
      return NextResponse.json(
        { success: false, error: 'Denumirea și codul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică duplicatul de cod
    const existaConfidentialitate = await prisma.confidentialitateDocument.findFirst({
      where: {
        cod: cod.toUpperCase()
      }
    })

    if (existaConfidentialitate) {
      return NextResponse.json(
        { success: false, error: 'Un nivel de confidențialitate cu acest cod există deja' },
        { status: 409 }
      )
    }

    const confidentialitateNoua = await prisma.confidentialitateDocument.create({
      data: {
        denumire: denumire.trim(),
        descriere: descriere?.trim() || null,
        cod: cod.toUpperCase().trim(),
        activ
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: confidentialitateNoua,
      message: 'Nivelul de confidențialitate a fost creat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la crearea nivelului de confidențialitate:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut crea nivelul de confidențialitate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizează nivel de confidențialitate
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, denumire, descriere, cod, activ } = body

    // Validări
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul nivelului de confidențialitate este obligatoriu' },
        { status: 400 }
      )
    }

    if (!denumire || !cod) {
      return NextResponse.json(
        { success: false, error: 'Denumirea și codul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică dacă nivelul de confidențialitate există
    const confidentialitateExistenta = await prisma.confidentialitateDocument.findUnique({
      where: { id }
    })

    if (!confidentialitateExistenta) {
      return NextResponse.json(
        { success: false, error: 'Nivelul de confidențialitate specificat nu există' },
        { status: 404 }
      )
    }

    // Verifică duplicatul de cod (exclus nivelul curent)
    const existaAltaConfidentialitate = await prisma.confidentialitateDocument.findFirst({
      where: {
        cod: cod.toUpperCase(),
        NOT: { id }
      }
    })

    if (existaAltaConfidentialitate) {
      return NextResponse.json(
        { success: false, error: 'Un alt nivel de confidențialitate cu acest cod există deja' },
        { status: 409 }
      )
    }

    const confidentialitateActualizata = await prisma.confidentialitateDocument.update({
      where: { id },
      data: {
        denumire: denumire.trim(),
        descriere: descriere?.trim() || null,
        cod: cod.toUpperCase().trim(),
        activ: activ !== undefined ? activ : true
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: confidentialitateActualizata,
      message: 'Nivelul de confidențialitate a fost actualizat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la actualizarea nivelului de confidențialitate:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza nivelul de confidențialitate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Șterge nivel de confidențialitate
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul nivelului de confidențialitate este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă nivelul de confidențialitate există
    const confidentialitateExistenta = await prisma.confidentialitateDocument.findUnique({
      where: { id },
      include: {
        categoriiDocumente: {
          select: { id: true }
        },
        inregistrari: {
          select: { id: true }
        }
      }
    })

    if (!confidentialitateExistenta) {
      return NextResponse.json(
        { success: false, error: 'Nivelul de confidențialitate specificat nu există' },
        { status: 404 }
      )
    }

    // Verifică dacă nivelul de confidențialitate este folosit în categorii de documente
    if (confidentialitateExistenta.categoriiDocumente && confidentialitateExistenta.categoriiDocumente.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Nu se poate șterge nivelul de confidențialitate. Există ${confidentialitateExistenta.categoriiDocumente.length} categorii de documente asociate.`,
          details: 'Schimbați nivelul de confidențialitate pentru categoriile asociate înainte de a șterge acest nivel.'
        },
        { status: 409 }
      )
    }

    // Verifică dacă nivelul de confidențialitate este folosit în înregistrări
    if (confidentialitateExistenta.inregistrari && confidentialitateExistenta.inregistrari.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Nu se poate șterge nivelul de confidențialitate. Există ${confidentialitateExistenta.inregistrari.length} înregistrări asociate.`,
          details: 'Schimbați nivelul de confidențialitate pentru înregistrările asociate înainte de a șterge acest nivel.'
        },
        { status: 409 }
      )
    }

    await prisma.confidentialitateDocument.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Nivelul de confidențialitate a fost șters cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea nivelului de confidențialitate:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut șterge nivelul de confidențialitate',
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
    const { id, activ } = body

    // Validări
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul nivelului de confidențialitate este obligatoriu' },
        { status: 400 }
      )
    }

    if (typeof activ !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Statusul activ trebuie să fie boolean' },
        { status: 400 }
      )
    }

    // Verifică dacă nivelul de confidențialitate există
    const confidentialitateExistenta = await prisma.confidentialitateDocument.findUnique({
      where: { id }
    })

    if (!confidentialitateExistenta) {
      return NextResponse.json(
        { success: false, error: 'Nivelul de confidențialitate specificat nu există' },
        { status: 404 }
      )
    }

    const confidentialitateActualizata = await prisma.confidentialitateDocument.update({
      where: { id },
      data: { activ }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: confidentialitateActualizata,
      message: `Nivelul de confidențialitate a fost ${activ ? 'activat' : 'dezactivat'} cu succes`
    }))

  } catch (error) {
    console.error('Eroare la actualizarea statusului nivelului de confidențialitate:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza statusul nivelului de confidențialitate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
