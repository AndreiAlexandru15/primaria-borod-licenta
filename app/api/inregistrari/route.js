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
      where.registru = { departamentId: departamentId }
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
    const skip = (page - 1) * limit
    // Execută query-ul cu include pentru relații
    const [inregistrari, total] = await Promise.all([
      prisma.inregistrare.findMany({
        where,
        include: {
          registru: { include: { departament: true } },
          fisiere: {
            orderBy: { createdAt: 'asc' }
          },
          confidentialitate: true,
          destinatarUtilizator: true // fix relation name
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
    // Adaugă dataFisier și confidentialitateFisierDenumire/cod la nivel de inregistrare pentru primul fișier (pentru DataTable)
    const inregistrariWithDataFisier = inregistrari.map(inr => {
      const fisier = inr.fisiere?.[0];
      return {
        ...inr,
        dataFisier: fisier?.dataFisier || null,
        confidentialitateFisierDenumire: fisier?.confidentialitateDenumire || fisier?.confidentialitate || inr.confidentialitate?.denumire || null,
        confidentialitateFisierCod: fisier?.confidentialitateCod || null,
        destinatarNume: inr.destinatarUtilizator ? `${inr.destinatarUtilizator.nume} ${inr.destinatarUtilizator.prenume}` : null,
        destinatarFunctie: inr.destinatarUtilizator?.functie || null
      };
    })
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1
    const serializedData = serializeBigInt({
      inregistrari: inregistrariWithDataFisier,
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
  try {
    const body = await request.json()
    const { 
      registruId, 
      expeditor, 
      destinatarId, // user ID
      obiect, 
      observatii,
      urgent = false, 
      confidential = false,
      tipDocumentId = null,
      fisiereIds = [], // Array de ID-uri de fișiere existente
      confidentialitateId = null // Adăugat pentru a seta nivelul de confidențialitate
    } = body

    // Validare
    if (!registruId || !obiect || !tipDocumentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registrul, obiectul și tipul de document sunt obligatorii' 
        },
        { status: 400 }
      )
    }
    if (!destinatarId) {
      return NextResponse.json(
        { success: false, error: 'Destinatarul este obligatoriu' },
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
    // Verifică dacă tipul de document există și aparține registrului
    const tipDocument = await prisma.tipDocument.findUnique({
      where: { id: tipDocumentId }
    })
    if (!tipDocument || tipDocument.registruId !== registruId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tipul de document nu există sau nu aparține registrului' 
        },
        { status: 400 }
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

    // Preia confidentialitateId din body sau din categoria documentului dacă nu e dat
    let finalConfidentialitateId = confidentialitateId
    if (!finalConfidentialitateId) {
      // Încearcă să preiei din categoria documentului dacă există fișiere
      if (fisiereIds.length > 0) {
        const firstFisier = await prisma.fisier.findUnique({ where: { id: fisiereIds[0] }, include: { categorie: true } })
        if (firstFisier?.categorie?.confidentialitateDefaultId) {
          finalConfidentialitateId = firstFisier.categorie.confidentialitateDefaultId
        }
      }
    }

    // Creează înregistrarea în tranzacție
    const result = await prisma.$transaction(async (tx) => {
      // Creează înregistrarea
      const inregistrare = await tx.inregistrare.create({
        data: {
          registruId,
          numarInregistrare,
          dataInregistrare,
          expeditor,
          destinatarId, // store user ID
          obiect,
          observatii,
          urgent,
          confidential,
          tipDocumentId,
          confidentialitateId: finalConfidentialitateId
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
      }// Returnează înregistrarea cu relațiile
      return await tx.inregistrare.findUnique({
        where: { id: inregistrare.id },
        include: {
          registru: {
            include: {
              departament: true
            }
          },
          fisiere: { orderBy: { createdAt: 'asc' } },
          confidentialitate: true,
          destinatarUtilizator: true // fix relation name
        }
      })
    })

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
