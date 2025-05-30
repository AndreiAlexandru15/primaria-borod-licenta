/**
 * API pentru gestionarea tipurilor de documente
 * @fileoverview CRUD pentru tipuri de documente specifice registrelor
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function pentru serializarea BigInt
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// GET - Listează tipurile de documente
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const registruId = searchParams.get('registruId')

    const where = {}
    if (registruId) {
      where.registruId = registruId
    }

    const tipuriDocumente = await prisma.tipDocument.findMany({
      where,
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
        },
        inregistrari: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        nume: 'asc'
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: tipuriDocumente.map(tip => ({
        ...tip,
        _count: {
          inregistrari: tip.inregistrari.length
        },
        inregistrari: undefined // Eliminăm array-ul, păstrăm doar count-ul
      }))
    }))

  } catch (error) {
    console.error('Eroare la listarea tipurilor de documente:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-au putut lista tipurile de documente',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Creează tip document nou
export async function POST(request) {
  try {
    const body = await request.json()
    const { nume, descriere, cod, registruId } = body

    // Validări
    if (!nume || !cod || !registruId) {
      return NextResponse.json(
        { success: false, error: 'Numele, codul și registrul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică dacă registrul există
    const registru = await prisma.registru.findUnique({
      where: { id: registruId }
    })

    if (!registru) {
      return NextResponse.json(
        { success: false, error: 'Registrul specificat nu există' },
        { status: 400 }
      )
    }

    // Verifică duplicatul de cod în același registru
    const existaTip = await prisma.tipDocument.findFirst({
      where: {
        cod: cod.toUpperCase(),
        registruId
      }
    })

    if (existaTip) {
      return NextResponse.json(
        { success: false, error: 'Un tip de document cu acest cod există deja în registru' },
        { status: 409 }
      )
    }

    const tipDocumentNou = await prisma.tipDocument.create({
      data: {
        nume: nume.trim(),
        descriere: descriere?.trim() || null,
        cod: cod.toUpperCase().trim(),
        registruId
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
      data: tipDocumentNou,
      message: 'Tipul de document a fost creat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la crearea tipului de document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut crea tipul de document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
