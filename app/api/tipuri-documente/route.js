import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const registruId = searchParams.get('registruId')

    if (!registruId) {
      return NextResponse.json(
        { success: false, error: 'ID-ul registrului este obligatoriu' },
        { status: 400 }
      )
    }

    const tipuriDocumente = await prisma.tipDocument.findMany({
      where: { 
        registruId,
        activ: true 
      },
      include: {
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true,
            descriere: true,
            perioadaRetentie: true
          }
        }
      },
      orderBy: [
        { ordineSortare: 'asc' },
        { nume: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: tipuriDocumente
    })
  } catch (error) {
    console.error('Eroare la încărcarea tipurilor de documente:', error)
    return NextResponse.json(
      { success: false, error: 'Nu s-au putut încărca tipurile de documente' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { registruId, categorieId, nume, cod, descriere, ordineSortare } = body

    if (!registruId || !nume || !cod) {
      return NextResponse.json(
        { success: false, error: 'Registrul, numele și codul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică dacă categoria există (dacă este specificată)
    if (categorieId) {
      const categorie = await prisma.categorieDocument.findUnique({
        where: { id: categorieId }
      })
      if (!categorie) {
        return NextResponse.json(
          { success: false, error: 'Categoria specificată nu există' },
          { status: 400 }
        )
      }
    }

    const tipDocument = await prisma.tipDocument.create({
      data: {
        registruId,
        categorieId: categorieId || null,
        nume: nume.trim(),
        cod: cod.trim().toUpperCase(),
        descriere: descriere?.trim() || null,
        ordineSortare: ordineSortare || 0
      },
      include: {
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: tipDocument,
      message: 'Tipul de document a fost creat cu succes'
    })
  } catch (error) {
    console.error('Eroare la crearea tipului de document:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Codul tipului de document există deja în acest registru' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Nu s-a putut crea tipul de document' },
      { status: 500 }
    )
  }
}