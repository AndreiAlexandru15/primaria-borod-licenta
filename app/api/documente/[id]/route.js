/**
 * API Route pentru operațiuni individuale pe înregistrare
 * @fileoverview GET, PUT, DELETE pentru înregistrare specifică
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

/**
 * GET /api/documente/[id]
 * Obține o înregistrare specifică
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
    
    const inregistrare = await prisma.inregistrare.findFirst({
      where: {
        id: id,
        registru: {
          departament: {
            primariaId: primariaId
          }
        }
      },
      include: {
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true,
            departament: {
              select: {
                id: true,
                nume: true,
                cod: true
              }
            }
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

    if (!inregistrare) {
      return NextResponse.json(
        { error: 'Înregistrarea nu a fost găsită' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inregistrare
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
 * Actualizează o înregistrare
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

    // Verifică dacă înregistrarea există
    const inregistrareExistenta = await prisma.inregistrare.findFirst({
      where: {
        id: id,
        registru: {
          departament: {
            primariaId: primariaId
          }
        }
      }
    })

    if (!inregistrareExistenta) {
      return NextResponse.json(
        { error: 'Înregistrarea nu a fost găsită' },
        { status: 404 }
      )
    }

    // Pregătește datele pentru actualizare
    const updateData = {}
    
    // Câmpuri care pot fi actualizate
    const updatableFields = [
      'expeditor', 'destinatar', 'obiect', 'observatii', 
      'urgent', 'confidential', 'status'
    ]

    updatableFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    })

    // Actualizează înregistrarea
    const inregistrareActualizata = await prisma.inregistrare.update({
      where: { id },
      data: updateData,
      include: {
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true,
            departament: {
              select: {
                id: true,
                nume: true,
                cod: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: inregistrareActualizata,
      message: 'Înregistrare actualizată cu succes'
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
 * Șterge o înregistrare
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

    // Verifică dacă înregistrarea există
    const inregistrare = await prisma.inregistrare.findFirst({
      where: {
        id: id,
        registru: {
          departament: {
            primariaId: primariaId
          }
        }
      },
      include: {
        _count: {
          select: {
            fisiere: true
          }
        }
      }
    })

    if (!inregistrare) {
      return NextResponse.json(
        { error: 'Înregistrarea nu a fost găsită' },
        { status: 404 }
      )
    }

    // Verifică dacă înregistrarea are fișiere asociate
    if (inregistrare._count.fisiere > 0) {
      return NextResponse.json(
        { 
          error: 'Nu se poate șterge înregistrarea deoarece are fișiere asociate. Ștergeți mai întâi fișierele.' 
        },
        { status: 400 }
      )
    }

    // Șterge înregistrarea
    await prisma.inregistrare.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Înregistrare ștersă cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea documentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă a serverului' },
      { status: 500 }
    )
  }
}
