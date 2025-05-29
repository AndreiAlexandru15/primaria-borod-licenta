/**
 * API pentru gestionarea înregistrărilor din registratură
 * @fileoverview CRUD operations pentru înregistrări cu documente atașate
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Listează înregistrările cu filtrare
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const registruId = searchParams.get('registruId')
    const departamentId = searchParams.get('departamentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    // Construiește filtrul
    const where = {}
    
    if (registruId) {
      where.registruId = registruId
    }
    
    if (departamentId) {
      where.registru = {
        departamentId: departamentId
      }
    }

    if (search) {
      where.OR = [
        { numarInregistrare: { contains: search, mode: 'insensitive' } },
        { expeditor: { contains: search, mode: 'insensitive' } },
        { destinatar: { contains: search, mode: 'insensitive' } },
        { obiect: { contains: search, mode: 'insensitive' } },
        { observatii: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculează offset pentru paginare
    const skip = (page - 1) * limit

    // Execută query-ul cu include pentru relații
    const [inregistrari, total] = await Promise.all([
      prisma.inregistrare.findMany({
        where,
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
        },
        orderBy: [
          { dataInregistrare: 'desc' },
          { numarInregistrare: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.inregistrare.count({ where })
    ])

    // Calculează metadatele pentru paginare
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        inregistrari,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPreviousPage
        }
      }
    })

  } catch (error) {
    console.error('Eroare la încărcarea înregistrărilor:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-au putut încărca înregistrările',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Creează o înregistrare nouă cu documente
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      registruId, 
      expeditor, 
      destinatar, 
      obiect, 
      observatii,
      urgent = false, 
      confidential = false,
      documenteIds = [] // Array de ID-uri de documente existente
    } = body

    // Validare
    if (!registruId || !obiect) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registrul și obiectul sunt obligatorii' 
        },
        { status: 400 }
      )
    }

    // Verifică dacă registrul există
    const registru = await prisma.registru.findUnique({
      where: { id: registruId }
    })

    if (!registru) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registrul specificat nu există' 
        },
        { status: 404 }
      )
    }

    // Generează numărul de înregistrare
    const dataInregistrare = new Date()
    const year = dataInregistrare.getFullYear()
    
    // Găsește ultimul număr de înregistrare pentru anul curent
    const ultimaInregistrare = await prisma.inregistrare.findFirst({
      where: {
        registruId: registruId,
        dataInregistrare: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      },
      orderBy: {
        numarInregistrare: 'desc'
      }
    })

    // Calculează următorul număr
    let nextNumber = 1
    if (ultimaInregistrare) {
      const currentNumber = parseInt(ultimaInregistrare.numarInregistrare.split('-').pop())
      nextNumber = currentNumber + 1
    }

    const numarInregistrare = `${registru.cod}-${year}-${String(nextNumber).padStart(4, '0')}`

    // Creează înregistrarea în tranzacție
    const result = await prisma.$transaction(async (tx) => {
      // Creează înregistrarea
      const inregistrare = await tx.inregistrare.create({
        data: {
          registruId,
          numarInregistrare,
          dataInregistrare,
          expeditor,
          destinatar,
          obiect,
          observatii,
          urgent,
          confidential
        }
      })

      // Atașează documentele dacă există
      if (documenteIds.length > 0) {
        const inregistrareDocumente = documenteIds.map((documentId, index) => ({
          inregistrareId: inregistrare.id,
          documentId,
          ordinea: index + 1
        }))

        await tx.inregistrareDocument.createMany({
          data: inregistrareDocumente
        })
      }

      // Returnează înregistrarea cu relațiile
      return await tx.inregistrare.findUnique({
        where: { id: inregistrare.id },
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
      message: `Înregistrarea ${numarInregistrare} a fost creată cu succes`
    }, { status: 201 })

  } catch (error) {
    console.error('Eroare la crearea înregistrării:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut crea înregistrarea',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
