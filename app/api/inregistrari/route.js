/**
 * API pentru gestionarea înregistrărilor din registratură
 * @fileoverview CRUD operations pentru înregistrări cu documente atașate
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rename } from 'fs/promises'
import { join, dirname, extname } from 'path'
import { existsSync } from 'fs'
import { AUDIT_ACTIONS, createAuditLogFromRequest } from '@/lib/audit'
import jwt from 'jsonwebtoken'
import { headers } from 'next/headers'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// Helper function pentru a obține ID-ul utilizatorului din token
async function getUserIdFromToken(request) {
  try {
    const headersList = headers()
    const userId = headersList.get('x-user-id')
    
    if (userId) {
      return userId
    }
    
    const authHeader = headersList.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded.userId
  } catch (error) {
    console.error('Eroare la decodarea token-ului:', error)
    return null
  }
}

// Helper function to build file path from FILES_PATH + caleRelativa + numeFisierDisk
function buildFilePath(caleRelativa, numeFisierDisk) {
  const filesPath = process.env.FILES_PATH || join(process.cwd(), 'uploads')
  return join(filesPath, caleRelativa, numeFisierDisk)
}

// Helper function to build file URL for client access
function buildFileUrl(caleRelativa, numeFisierDisk) {
  // Construiește URL-ul relativ pentru accesul din client
  const cleanPath = `${caleRelativa}/${numeFisierDisk}`.replace(/\\/g, '/')
  return `/api/files/${cleanPath}`
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
      const oldPath = buildFilePath(fisier.caleRelativa, fisier.numeFisierDisk)
      
      if (existsSync(oldPath)) {
        // Creează noul nume: "Nr. Înregistrare_numeOriginal"
        const extensie = fisier.extensie ? `.${fisier.extensie}` : ''
        const numeOriginalFaraExtensie = fisier.numeOriginal.replace(new RegExp(`\\.${fisier.extensie}$`, 'i'), '')
        const numeNou = `${numarInregistrare}_${numeOriginalFaraExtensie}${extensie}`
        
        // Calculează noua cale completă
        const newPath = buildFilePath(fisier.caleRelativa, numeNou)

        // Redenumește fișierul pe disk
        await rename(oldPath, newPath)

        // Actualizează baza de date - doar numeFisierDisk se schimbă
        await prisma.fisier.update({
          where: { id: fisier.id },
          data: {
            numeFisierDisk: numeNou
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
          destinatarUtilizator: true
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

    // Adaugă dataFisier, confidentialitate și document object pentru primul fișier
    const inregistrariWithDataFisier = inregistrari.map(inr => {
      const fisier = inr.fisiere?.[0];
      
      // Construiește obiectul document pentru primul fișier
      let document = null;
      if (fisier) {
        // Folosește noua funcție pentru URL
        const fileUrl = buildFileUrl(fisier.caleRelativa, fisier.numeFisierDisk);
        
        document = {
          url: fileUrl,
          downloadUrl: `${fileUrl}?download=true`,
          name: fisier.numeOriginal || fisier.numeFisierDisk,
          type: fisier.tipMime || `application/${fisier.extensie}`,
          size: fisier.marime ? fisier.marime.toString() : null,
          extension: fisier.extensie,
          fullPath: buildFilePath(fisier.caleRelativa, fisier.numeFisierDisk) // pentru debugging
        };
      }
      
      return {
        ...inr,
        dataFisier: fisier?.dataFisier || null,
        confidentialitateFisierDenumire: fisier?.confidentialitateDenumire || fisier?.confidentialitate || inr.confidentialitate?.denumire || null,
        confidentialitateFisierCod: fisier?.confidentialitateCod || null,
        destinatarNume: inr.destinatarUtilizator ? `${inr.destinatarUtilizator.nume} ${inr.destinatarUtilizator.prenume}` : null,
        destinatarFunctie: inr.destinatarUtilizator?.functie || null,
        document: document // Adaugă obiectul document complet
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
  const userId = await getUserIdFromToken(request)
  
  try {
    const body = await request.json()
    const { 
      registruId, 
      expeditor, 
      destinatarId,
      obiect, 
      observatii,
      dataDocument,
      dataInregistrare,
      urgent = false, 
      confidential = false,
      tipDocumentId = null,
      fisiereIds = [],
      confidentialitateId = null,
      numarDocument
    } = body

    // Validare
    if (!registruId || !obiect || !tipDocumentId) {
      // Log încercare de creare cu date incomplete
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
          userId: userId,
          details: {
            success: false,
            error: 'Registrul, obiectul și tipul de document sunt obligatorii',
            requestData: body
          }
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registrul, obiectul și tipul de document sunt obligatorii' 
        },
        { status: 400 }
      )
    }
    
    if (!destinatarId) {
      // Log încercare de creare fără destinatar
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
          userId: userId,
          details: {
            success: false,
            error: 'Destinatarul este obligatoriu',
            requestData: body
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Destinatarul este obligatoriu' },
        { status: 400 }
      )
    }
    
    if (!numarDocument) {
      // Log încercare de creare fără număr document
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
          userId: userId,
          details: {
            success: false,
            error: 'Numărul documentului este obligatoriu',
            requestData: body
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Numărul documentului este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă registrul există
    const registru = await prisma.registru.findUnique({
      where: { id: registruId },
      include: { departament: true }
    })
    if (!registru) {
      // Log încercare de creare cu registru inexistent
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
          userId: userId,
          details: {
            success: false,
            error: 'Registrul specificat nu există',
            registruId,
            requestData: body
          }
        })
      }
      
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
      where: { id: tipDocumentId },
      include: { registru: true }
    })
    if (!tipDocument || tipDocument.registruId !== registruId) {
      // Log încercare de creare cu tip document invalid
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
          userId: userId,
          details: {
            success: false,
            error: 'Tipul de document nu există sau nu aparține registrului',
            tipDocumentId,
            registruId,
            requestData: body
          }
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tipul de document nu există sau nu aparține registrului' 
        },
        { status: 400 }
      )
    }

    // Folosește data înregistrării din formular sau data curentă ca fallback
    const finalDataInregistrare = dataInregistrare ? new Date(dataInregistrare) : new Date()
    
    // Găsește ultimul număr de înregistrare pentru registru
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

    // Preia confidentialitateId din body sau din categoria documentului
    let finalConfidentialitateId = confidentialitateId
    if (!finalConfidentialitateId) {
      if (fisiereIds.length > 0) {
        const firstFisier = await prisma.fisier.findUnique({ 
          where: { id: fisiereIds[0] }, 
          include: { categorie: true } 
        })
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
          dataInregistrare: finalDataInregistrare,
          expeditor,
          destinatarId,
          obiect,
          observatii,
          urgent,
          confidential,
          tipDocumentId,
          confidentialitateId: finalConfidentialitateId,
          numarDocument
        }
      })

      // Atașează fișierele dacă există
      if (fisiereIds.length > 0) {
        const updateData = {
          inregistrareId: inregistrare.id
        }
        
        if (dataDocument) {
          updateData.dataFisier = new Date(dataDocument)
        }
        
        await tx.fisier.updateMany({
          where: {
            id: { in: fisiereIds }
          },
          data: updateData
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
          fisiere: { orderBy: { createdAt: 'asc' } },
          confidentialitate: true,
          destinatarUtilizator: true,
          tipDocument: true
        }
      })
    })

    // Redenumește fișierele pe disk cu numărul de înregistrare
    if (fisiereIds.length > 0) {
      await renameFisiereForInregistrare(result.id, numarInregistrare)
      
      // Actualizează result cu noile nume de fișiere
      const updatedResult = await prisma.inregistrare.findUnique({
        where: { id: result.id },
        include: {
          registru: { include: { departament: true } },
          fisiere: { orderBy: { createdAt: 'asc' } },
          confidentialitate: true,
          destinatarUtilizator: true,
          tipDocument: true
        }
      })

      // Adaugă obiectul document pentru primul fișier
      const fisier = updatedResult.fisiere?.[0];
      let document = null;
      if (fisier) {
        const fileUrl = buildFileUrl(fisier.caleRelativa, fisier.numeFisierDisk);
        document = {
          url: fileUrl,
          downloadUrl: `${fileUrl}?download=true`,
          name: fisier.numeOriginal || fisier.numeFisierDisk,
          type: fisier.tipMime || `application/${fisier.extensie}`,
          size: fisier.marime ? fisier.marime.toString() : null,
          extension: fisier.extensie,
          fullPath: buildFilePath(fisier.caleRelativa, fisier.numeFisierDisk)
        };
      }

      const finalResult = {
        ...updatedResult,
        document: document
      }      // Log creare reușită cu fișiere
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
          userId: userId,
          entityType: 'INREGISTRARE',
          entityId: finalResult.id,
          details: {
            success: true,
            inregistrareId: finalResult.id,
            numarInregistrare: finalResult.numarInregistrare,
            expeditor: finalResult.expeditor,
            destinatarId: finalResult.destinatarId,
            obiect: finalResult.obiect,
            urgent: finalResult.urgent,
            confidential: finalResult.confidential,
            registruNume: finalResult.registru?.nume,
            departamentNume: finalResult.registru?.departament?.nume,
            tipDocumentNume: finalResult.tipDocument?.nume,
            destinatarNume: finalResult.destinatarUtilizator ? 
              `${finalResult.destinatarUtilizator.nume} ${finalResult.destinatarUtilizator.prenume}` : null,
            fisiereAtasate: fisiereIds.length,
            hasFiles: true
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: serializeBigInt(finalResult),
        message: `Înregistrarea ${numarInregistrare} a fost creată cu succes`
      }, { status: 201 })
    }

    // Adaugă document object chiar și fără fișiere
    const resultWithDocument = {
      ...result,
      document: null
    }

    // Log creare reușită fără fișiere
    if (userId) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
        userId: userId,
        entityType: 'INREGISTRARE',
        entityId: result.id,
        details: {
          success: true,
          numarInregistrare: result.numarInregistrare,
          expeditor: result.expeditor,
          destinatarId: result.destinatarId,
          obiect: result.obiect,
          urgent: result.urgent,
          confidential: result.confidential,
          registruNume: result.registru?.nume,
          departamentNume: result.registru?.departament?.nume,
          tipDocumentNume: result.tipDocument?.nume,
          destinatarNume: result.destinatarUtilizator ? 
            `${result.destinatarUtilizator.nume} ${result.destinatarUtilizator.prenume}` : null,
          hasFiles: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt(resultWithDocument),
      message: `Înregistrarea ${numarInregistrare} a fost creată cu succes`
    }, { status: 201 })

  } catch (error) {
    console.error('Eroare la crearea înregistrării:', error)
    
    // Log eroare de creare
    if (userId) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_INREGISTRARE,
        userId: userId,
        details: {
          success: false,
          error: 'Nu s-a putut crea înregistrarea',
          errorDetails: error.message,
          requestData: body
        }
      })
    }
    
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