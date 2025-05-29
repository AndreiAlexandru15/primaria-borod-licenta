/**
 * API pentru gestionarea înregistrărilor din registratură
 * @fileoverview CRUD operations pentru înregistrări cu documente atașate
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { rename } from 'fs/promises'
import { join, dirname, extname } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// Helper function to rename files based on registration number
async function renameFisiereForInregistrare(inregistrareId, numarInregistrare) {
  try {
    const fisiere = await prisma.fisier.findMany({
      where: { inregistrareId },
      select: {
        id: true,
        numeOriginal: true,
        numeFisierDisk: true,
        caleRelativa: true,
        extensie: true
      }
    })

    for (const fisier of fisiere) {
      const oldPath = join(process.cwd(), fisier.caleRelativa)
      
      if (existsSync(oldPath)) {
        // Creează noul nume: "Nr. Înregistrare_numeOriginal"
        const extensie = fisier.extensie ? `.${fisier.extensie}` : ''
        const numeOriginalFaraExtensie = fisier.numeOriginal.replace(new RegExp(`\\.${fisier.extensie}$`, 'i'), '')
        const numeNou = `${numarInregistrare}_${numeOriginalFaraExtensie}${extensie}`
        
        // Calculează noua cale
        const oldDir = dirname(fisier.caleRelativa)
        const nouaCaleRelativa = `${oldDir}/${numeNou}`.replace(/\\/g, '/')
        const newPath = join(process.cwd(), nouaCaleRelativa)

        // Redenumește fișierul pe disk
        await rename(oldPath, newPath)

        // Actualizează baza de date
        await prisma.fisier.update({
          where: { id: fisier.id },
          data: {
            numeFisierDisk: numeNou,
            caleRelativa: nouaCaleRelativa
          }
        })

        console.log(`Fișier redenumit: ${fisier.numeFisierDisk} -> ${numeNou}`)
      }
    }
  } catch (error) {
    console.error('Eroare la redenumirea fișierelor:', error)
    // Nu aruncăm eroare pentru a nu afecta crearea înregistrării
  }
}

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
        where,        include: {
          registru: {
            include: {
              departament: true
            }
          },
          fisiere: {
            orderBy: {
              createdAt: 'asc'
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
    ])    // Calculează metadatele pentru paginare
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    // Serialize data to handle BigInt values
    const serializedData = serializeBigInt({
      inregistrari,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage
      }
    })

    return NextResponse.json({
      success: true,
      data: serializedData
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
  try {    const body = await request.json()
    const { 
      registruId, 
      expeditor, 
      destinatar, 
      obiect, 
      observatii,
      urgent = false, 
      confidential = false,
      fisiereIds = [] // Array de ID-uri de fișiere existente
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
    }    // Generează numărul de înregistrare
    const dataInregistrare = new Date()
    
    // Găsește ultimul număr de înregistrare pentru registru (fără an)
    const ultimaInregistrare = await prisma.inregistrare.findFirst({
      where: {
        registruId: registruId
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

    const numarInregistrare = `${registru.cod}-${String(nextNumber).padStart(4, '0')}`

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
      })      // Atașează fișierele dacă există
      if (fisiereIds.length > 0) {
        await tx.fisier.updateMany({
          where: {
            id: { in: fisiereIds }
          },
          data: {
            inregistrareId: inregistrare.id
          }
        })
      }      // Returnează înregistrarea cu relațiile
      return await tx.inregistrare.findUnique({
        where: { id: inregistrare.id },
        include: {
          registru: {
            include: {
              departament: true
            }
          },
          fisiere: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })    })

    // Redenumește fișierele pe disk cu numărul de înregistrare
    if (fisiereIds.length > 0) {
      await renameFisiereForInregistrare(result.id, numarInregistrare)
    }

    // Serialize the result to handle BigInt values
    const serializedResult = serializeBigInt(result)

    return NextResponse.json({
      success: true,
      data: serializedResult,
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
