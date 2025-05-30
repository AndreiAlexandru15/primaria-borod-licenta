/**
 * API pentru o înregistrare specifică
 * @fileoverview CRUD operations pentru o înregistrare individuală
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

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
        fisiere: true,
        confidentialitate: true,
        destinatarUtilizator: true,
        tipDocument: true
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
    // Asigură includerea numarDocument în răspuns
    return NextResponse.json(serializeBigInt({
      success: true,
      data: { ...inregistrare, numarDocument: inregistrare.numarDocument },
    }))

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
      documenteIds = [], // Noi documente de atașat
      numarDocument, // Nou
      dataDocument, // Data documentului - va fi salvată în fisier
      tipDocumentId, // Tipul documentului
      destinatarId, // ID-ul destinatarului
      fisierAtas, // Fișierul atașat nou
      fisierVechiId, // ID-ul fișierului vechi, dacă există
    } = body

    // Verifică dacă înregistrarea există
    const inregistrareExistenta = await prisma.inregistrare.findUnique({
      where: { id },
      include: {
        fisiere: true,
        confidentialitate: true,
        destinatarUtilizator: true,
        tipDocument: true,
        registru: true
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
    }    // Actualizează în tranzacție
    const result = await prisma.$transaction(async (tx) => {      // Actualizează înregistrarea
      const inregistrare = await tx.inregistrare.update({
        where: { id },
        data: {
          expeditor,
          destinatar,
          destinatarId: destinatarId || null,
          obiect,
          observatii,
          urgent,
          confidential,
          status,
          numarDocument,
          tipDocumentId: tipDocumentId || null,
          // updatează fișierul dacă e nevoie
          fisiere: fisierAtas
            ? {
                set: [{ id: fisierAtas }]
              }
            : { set: [] }
        }
      })

      // Actualizează data documentului în fișierul asociat
      if (fisierAtas && dataDocument) {
        await tx.fisier.update({
          where: { id: fisierAtas },
          data: {
            dataFisier: new Date(dataDocument)
          }
        })
      }

      // Șterge fișierul vechi dacă a fost înlocuit
      if (fisierVechiId && fisierAtas && fisierVechiId !== fisierAtas) {
        // Șterge din DB
        await tx.fisier.delete({ where: { id: fisierVechiId } })
        // Șterge din storage
        const oldFile = inregistrareExistenta.fisiere.find(f => f.id === fisierVechiId)
        if (oldFile && oldFile.caleRelativa) {
          const fs = require('fs')
          const path = require('path')
          const filePath = path.join(process.cwd(), 'uploads', oldFile.caleRelativa)
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          } catch (err) {
            console.error('Eroare la ștergerea fișierului din storage:', err)
          }
        }
      }

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
          fisiere: true,
          confidentialitate: true,
          destinatarUtilizator: true,
          tipDocument: true,
          registru: true
        }
      })
    })
    return NextResponse.json(serializeBigInt({
      success: true,
      data: result,
      message: 'Înregistrarea a fost actualizată cu succes'
    }))

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
