/**
 * API Route pentru operațiuni individuale pe document
 * @fileoverview GET, PUT, DELETE pentru document specific
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

/**
 * GET /api/documente/[id]
 * Obține un document specific
 */
export async function GET(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      },
      include: {
        departament: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true
          }
        },
        fisiere: {
          select: {
            id: true,
            numeOriginal: true,
            marime: true,
            tipMime: true,
            caleRelativa: true,
            createdAt: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Documentul nu a fost găsit' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error) {
    console.error('Eroare la obținerea documentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă a serverului' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/documente/[id]
 * Actualizează un document
 */
export async function PUT(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()

    // Verifică dacă documentul există
    const documentExistent = await prisma.document.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      }
    })

    if (!documentExistent) {
      return NextResponse.json(
        { error: 'Documentul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Pregătește datele pentru actualizare
    const updateData = {}
    
    // Câmpuri care pot fi actualizate
    const updatableFields = [
      'expeditor', 'destinatar', 'subiect', 'tipDocument',
      'confidentialitate', 'prioritate', 'status', 'observatii'
    ]

    updatableFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    })

    // Actualizează documentul
    const documentActualizat = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        departament: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: documentActualizat,
      message: 'Document actualizat cu succes'
    })

  } catch (error) {
    console.error('Eroare la actualizarea documentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă a serverului' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/documente/[id]
 * Șterge un document
 */
export async function DELETE(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verifică dacă documentul există
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      },
      include: {
        _count: {
          select: {
            fisiere: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Documentul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică dacă documentul are fișiere asociate
    if (document._count.fisiere > 0) {
      return NextResponse.json(
        { 
          error: 'Nu se poate șterge documentul deoarece are fișiere asociate. Ștergeți mai întâi fișierele.' 
        },
        { status: 400 }
      )
    }

    // Șterge documentul
    await prisma.document.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Document șters cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea documentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă a serverului' },
      { status: 500 }
    )
  }
}
