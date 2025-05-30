/**
 * API pentru operațiuni individuale pe tipuri de documente
 * @fileoverview GET, PUT, DELETE pentru un tip de document specific
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function pentru serializarea BigInt
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// GET - Obține un tip de document specific
export async function GET(request, { params }) {
  try {
    const { id } = params

    const tipDocument = await prisma.tipDocument.findUnique({
      where: { id },
      include: {
        registru: {
          include: {
            departament: {
              select: {
                nume: true,
                cod: true
              }
            }
          }
        },
        inregistrari: {
          select: {
            id: true,
            numarInregistrare: true,
            obiect: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Ultimele 10 înregistrări
        }
      }
    })

    if (!tipDocument) {
      return NextResponse.json(
        { success: false, error: 'Tipul de document nu a fost găsit' },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data: tipDocument
    }))

  } catch (error) {
    console.error('Eroare la obținerea tipului de document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut obține tipul de document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizează un tip de document
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { nume, descriere, cod } = body

    // Validări
    if (!nume || !cod) {
      return NextResponse.json(
        { success: false, error: 'Numele și codul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică dacă tipul de document există
    const tipExistent = await prisma.tipDocument.findUnique({
      where: { id },
      include: { registru: true }
    })

    if (!tipExistent) {
      return NextResponse.json(
        { success: false, error: 'Tipul de document nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică duplicatul de cod în același registru (exclus current)
    const existaTipCuCod = await prisma.tipDocument.findFirst({
      where: {
        cod: cod.toUpperCase(),
        registruId: tipExistent.registruId,
        id: { not: id }
      }
    })

    if (existaTipCuCod) {
      return NextResponse.json(
        { success: false, error: 'Un tip de document cu acest cod există deja în registru' },
        { status: 409 }
      )
    }

    const tipDocumentActualizat = await prisma.tipDocument.update({
      where: { id },
      data: {
        nume: nume.trim(),
        descriere: descriere?.trim() || null,
        cod: cod.toUpperCase().trim()
      },
      include: {
        registru: {
          select: {
            nume: true,
            cod: true,
            departament: {
              select: {
                nume: true,
                cod: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: tipDocumentActualizat,
      message: 'Tipul de document a fost actualizat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la actualizarea tipului de document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza tipul de document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Șterge un tip de document
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Verifică dacă tipul de document există
    const tipDocument = await prisma.tipDocument.findUnique({
      where: { id },
      include: {
        inregistrari: {
          select: { id: true }
        }
      }
    })

    if (!tipDocument) {
      return NextResponse.json(
        { success: false, error: 'Tipul de document nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică dacă are înregistrări asociate
    if (tipDocument.inregistrari.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Nu se poate șterge tipul de document. Are ${tipDocument.inregistrari.length} înregistrări asociate.` 
        },
        { status: 409 }
      )
    }

    await prisma.tipDocument.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Tipul de document a fost șters cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea tipului de document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut șterge tipul de document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
