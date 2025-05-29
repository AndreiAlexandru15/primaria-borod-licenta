/**
 * API pentru o înregistrare specifică
 * @fileoverview CRUD operations pentru o înregistrare individuală
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obține o înregistrare specifică
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const inregistrare = await prisma.inregistrare.findUnique({
      where: { id },
      include: {
        registru: {
          include: {
            departament: true
          }
        },
        documente: {
          include: {
            document: true
          },
          orderBy: {
            ordinea: 'asc'
          }
        }
      }
    })

    if (!inregistrare) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Înregistrarea nu a fost găsită' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inregistrare
    })

  } catch (error) {
    console.error('Eroare la încărcarea înregistrării:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut încărca înregistrarea',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizează o înregistrare
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      expeditor, 
      destinatar, 
      obiect, 
      observatii,
      urgent, 
      confidential,
      status,
      documenteIds = [] // Noi documente de atașat
    } = body

    // Verifică dacă înregistrarea există
    const inregistrareExistenta = await prisma.inregistrare.findUnique({
      where: { id },
      include: {
        documente: true
      }
    })

    if (!inregistrareExistenta) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Înregistrarea nu a fost găsită' 
        },
        { status: 404 }
      )
    }

    // Actualizează în tranzacție
    const result = await prisma.$transaction(async (tx) => {
      // Actualizează înregistrarea
      const inregistrare = await tx.inregistrare.update({
        where: { id },
        data: {
          expeditor,
          destinatar,
          obiect,
          observatii,
          urgent,
          confidential,
          status
        }
      })

      // Dacă sunt specificate documente noi, le înlocuiește
      if (documenteIds.length > 0) {
        // Șterge relațiile existente
        await tx.inregistrareDocument.deleteMany({
          where: { inregistrareId: id }
        })

        // Creează relațiile noi
        const inregistrareDocumente = documenteIds.map((documentId, index) => ({
          inregistrareId: id,
          documentId,
          ordinea: index + 1
        }))

        await tx.inregistrareDocument.createMany({
          data: inregistrareDocumente
        })
      }

      // Returnează înregistrarea actualizată
      return await tx.inregistrare.findUnique({
        where: { id },
        include: {
          registru: {
            include: {
              departament: true
            }
          },
          documente: {
            include: {
              document: true
            },
            orderBy: {
              ordinea: 'asc'
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Înregistrarea a fost actualizată cu succes'
    })

  } catch (error) {
    console.error('Eroare la actualizarea înregistrării:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza înregistrarea',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Șterge o înregistrare
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Verifică dacă înregistrarea există
    const inregistrareExistenta = await prisma.inregistrare.findUnique({
      where: { id }
    })

    if (!inregistrareExistenta) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Înregistrarea nu a fost găsită' 
        },
        { status: 404 }
      )
    }

    // Șterge înregistrarea (relațiile se șterg automat prin CASCADE)
    await prisma.inregistrare.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Înregistrarea a fost ștearsă cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea înregistrării:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut șterge înregistrarea',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
