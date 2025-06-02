/**
 * API pentru o înregistrare specifică
 * @fileoverview CRUD operations pentru o înregistrare individuală
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { AUDIT_ACTIONS, createAuditLogFromRequest } from '@/lib/audit'
import jwt from 'jsonwebtoken'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// Helper function pentru a obține utilizatorul din token
async function getUserFromToken(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const user = await prisma.utilizator.findUnique({
      where: { id: decoded.userId },
      select: { id: true, nume: true, prenume: true, email: true }
    })
    
    return user
  } catch (error) {
    console.error('Eroare la verificarea token-ului:', error)
    return null
  }
}

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
  const user = await getUserFromToken(request)
  
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

    if (!id) {      // Log încercare de actualizare fără ID
      if (user) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.UPDATE_INREGISTRARE,
          userId: user.id,
          entityType: 'INREGISTRARE',
          entityId: id,
          details: {
            success: false,
            error: 'ID-ul înregistrării este obligatoriu',
            requestData: body
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'ID-ul înregistrării este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă înregistrarea există
    const inregistrareExistenta = await prisma.inregistrare.findUnique({
      where: { id },
      include: {
        fisiere: true,
        confidentialitate: true,
        destinatarUtilizator: true,
        tipDocument: true,
        registru: {
          include: {
            departament: true
          }
        }
      }
    })

    if (!inregistrareExistenta) {      // Log încercare de actualizare pentru înregistrare inexistentă
      if (user) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.UPDATE_INREGISTRARE,
          userId: user.id,
          entityType: 'INREGISTRARE',
          entityId: id,
          details: {
            success: false,
            error: 'Înregistrarea nu a fost găsită',
            inregistrareId: id
          }
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Înregistrarea nu a fost găsită' 
        },
        { status: 404 }
      )
    }

    // Salvare date vechi pentru audit
    const oldData = {
      expeditor: inregistrareExistenta.expeditor,
      destinatar: inregistrareExistenta.destinatar,
      destinatarId: inregistrareExistenta.destinatarId,
      obiect: inregistrareExistenta.obiect,
      observatii: inregistrareExistenta.observatii,
      urgent: inregistrareExistenta.urgent,
      confidential: inregistrareExistenta.confidential,
      status: inregistrareExistenta.status,
      numarDocument: inregistrareExistenta.numarDocument,
      tipDocumentId: inregistrareExistenta.tipDocumentId,
      fisiere: inregistrareExistenta.fisiere.map(f => ({
        id: f.id,
        numeOriginal: f.numeOriginal,
        dataFisier: f.dataFisier
      }))
    }

    // Actualizează în tranzacție
    const result = await prisma.$transaction(async (tx) => {
      // Actualizează înregistrarea
      const inregistrare = await tx.inregistrare.update({
        where: { id },
        data: {
          expeditor: expeditor !== undefined ? expeditor : inregistrareExistenta.expeditor,
          destinatar: destinatar !== undefined ? destinatar : inregistrareExistenta.destinatar,
          destinatarId: destinatarId !== undefined ? destinatarId : inregistrareExistenta.destinatarId,
          obiect: obiect !== undefined ? obiect : inregistrareExistenta.obiect,
          observatii: observatii !== undefined ? observatii : inregistrareExistenta.observatii,
          urgent: urgent !== undefined ? urgent : inregistrareExistenta.urgent,
          confidential: confidential !== undefined ? confidential : inregistrareExistenta.confidential,
          status: status !== undefined ? status : inregistrareExistenta.status,
          numarDocument: numarDocument !== undefined ? numarDocument : inregistrareExistenta.numarDocument,
          tipDocumentId: tipDocumentId !== undefined ? tipDocumentId : inregistrareExistenta.tipDocumentId
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
        // Verifică mai întâi dacă fișierul există în baza de date
        const fisierExistent = await tx.fisier.findUnique({
          where: { id: fisierVechiId }
        })
        
        if (fisierExistent) {
          // Șterge din DB doar dacă există
          await tx.fisier.delete({ where: { id: fisierVechiId } })
          
          // Șterge din storage
          if (fisierExistent.caleRelativa) {
            const fs = require('fs')
            const path = require('path')
            const filePath = path.join(process.cwd(), fisierExistent.caleRelativa)
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
              }
            } catch (err) {
              console.error('Eroare la ștergerea fișierului din storage:', err)
            }
          }
        } else {
          console.log(`Fișierul cu ID ${fisierVechiId} a fost deja șters`)
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
          registru: {
            include: {
              departament: true
            }
          }
        }
      })
    })

    // Salvare date noi pentru audit
    const newData = {
      expeditor: result.expeditor,
      destinatar: result.destinatar,
      destinatarId: result.destinatarId,
      obiect: result.obiect,
      observatii: result.observatii,
      urgent: result.urgent,
      confidential: result.confidential,
      status: result.status,
      numarDocument: result.numarDocument,
      tipDocumentId: result.tipDocumentId,
      fisiere: result.fisiere.map(f => ({
        id: f.id,
        numeOriginal: f.numeOriginal,
        dataFisier: f.dataFisier
      }))
    }    // Log actualizare reușită
    if (user) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.UPDATE_INREGISTRARE,
        userId: user.id,
        entityType: 'INREGISTRARE',
        entityId: id,
        details: {
          success: true,
          inregistrareId: id,
          numarInregistrare: result.numarInregistrare,
          registruNume: result.registru?.nume,
          departamentNume: result.registru?.departament?.nume,
          tipDocumentNume: result.tipDocument?.nume,
          destinatarNume: result.destinatarUtilizator ? 
            `${result.destinatarUtilizator.nume} ${result.destinatarUtilizator.prenume}` : null,
          oldData,
          newData,
          changes: {
            expeditor: oldData.expeditor !== newData.expeditor,
            destinatar: oldData.destinatar !== newData.destinatar,
            destinatarId: oldData.destinatarId !== newData.destinatarId,
            obiect: oldData.obiect !== newData.obiect,
            observatii: oldData.observatii !== newData.observatii,
            urgent: oldData.urgent !== newData.urgent,
            confidential: oldData.confidential !== newData.confidential,
            status: oldData.status !== newData.status,
            numarDocument: oldData.numarDocument !== newData.numarDocument,
            tipDocumentId: oldData.tipDocumentId !== newData.tipDocumentId,
            fisierReplacements: fisierVechiId && fisierAtas ? 1 : 0
          },
          fileOperations: {
            fisierVechiId,
            fisierAtas,
            documenteIds: documenteIds.length > 0 ? documenteIds : null
          }
        }
      })
    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data: result,
      message: 'Înregistrarea a fost actualizată cu succes'
    }))

  } catch (error) {
    console.error('Eroare la actualizarea înregistrării:', error)
      // Log eroare de actualizare
    if (user) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.UPDATE_INREGISTRARE,
        userId: user.id,
        entityType: 'INREGISTRARE',
        entityId: id,
        details: {
          success: false,
          error: 'Nu s-a putut actualiza înregistrarea',
          errorDetails: error.message,
          inregistrareId: id
        }
      })
    }
    
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
  const user = await getUserFromToken(request)
  let id = null
  
  try {
    const deleteParams = await params
    id = deleteParams.id

    if (!id) {      // Log încercare de ștergere fără ID
      if (user) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.DELETE_INREGISTRARE,
          userId: user.id,
          entityType: 'INREGISTRARE',
          entityId: id,
          details: {
            success: false,
            error: 'ID-ul înregistrării este obligatoriu'
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'ID-ul înregistrării este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă înregistrarea există și obține fișierele asociate
    const inregistrareExistenta = await prisma.inregistrare.findUnique({
      where: { id },
      include: {
        fisiere: {
          select: {
            id: true,
            caleRelativa: true,
            numeFisierDisk: true,
            numeOriginal: true,
            tipMime: true,
            marime: true
          }
        },
        registru: {
          include: {
            departament: true
          }
        },
        confidentialitate: true,
        destinatarUtilizator: true,
        tipDocument: true
      }
    })

    if (!inregistrareExistenta) {      // Log încercare de ștergere pentru înregistrare inexistentă
      if (user) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.DELETE_INREGISTRARE,
          userId: user.id,
          entityType: 'INREGISTRARE',
          entityId: id,
          details: {
            success: false,
            error: 'Înregistrarea nu a fost găsită',
            inregistrareId: id
          }
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Înregistrarea nu a fost găsită' 
        },
        { status: 404 }
      )
    }

    // Salvare informații pentru audit înainte de ștergere
    const deletedData = {
      id: inregistrareExistenta.id,
      numarInregistrare: inregistrareExistenta.numarInregistrare,
      expeditor: inregistrareExistenta.expeditor,
      destinatar: inregistrareExistenta.destinatar,
      destinatarId: inregistrareExistenta.destinatarId,
      obiect: inregistrareExistenta.obiect,
      observatii: inregistrareExistenta.observatii,
      dataInregistrare: inregistrareExistenta.dataInregistrare,
      urgent: inregistrareExistenta.urgent,
      confidential: inregistrareExistenta.confidential,
      status: inregistrareExistenta.status,
      numarDocument: inregistrareExistenta.numarDocument,
      registruId: inregistrareExistenta.registruId,
      tipDocumentId: inregistrareExistenta.tipDocumentId,
      confidentialitateId: inregistrareExistenta.confidentialitateId,
      registruNume: inregistrareExistenta.registru?.nume,
      departamentNume: inregistrareExistenta.registru?.departament?.nume,
      tipDocumentNume: inregistrareExistenta.tipDocument?.nume,
      destinatarNume: inregistrareExistenta.destinatarUtilizator ? 
        `${inregistrareExistenta.destinatarUtilizator.nume} ${inregistrareExistenta.destinatarUtilizator.prenume}` : null,
      fisiere: inregistrareExistenta.fisiere.map(f => ({
        id: f.id,
        numeOriginal: f.numeOriginal,
        numeFisierDisk: f.numeFisierDisk,
        caleRelativa: f.caleRelativa,
        tipMime: f.tipMime,
        marime: Number(f.marime)
      }))
    }

    // 1. ÎNAINTE de ștergerea din baza de date, șterge fișierele fizice din storage
    const filesDeleteResults = []
    if (inregistrareExistenta.fisiere.length > 0) {
      for (const fisier of inregistrareExistenta.fisiere) {
        let fileDeleteSuccess = false
        let filePath = null
        
        try {
          // Șterge fișierul fizic din storage
          if (fisier.caleRelativa && fisier.numeFisierDisk) {
            // Construire cale completă folosind FILES_PATH din .env
            const basePath = process.env.FILES_PATH || './storage/files'
            filePath = join(basePath, fisier.caleRelativa, fisier.numeFisierDisk)
            
            if (existsSync(filePath)) {
              await unlink(filePath)
              console.log(`Fișier șters din storage: ${filePath}`)
              fileDeleteSuccess = true
            } else {
              console.warn(`Fișierul nu există în storage: ${filePath}`)
              fileDeleteSuccess = false // Considerăm că nu este o eroare critică
            }
          }
        } catch (storageError) {
          console.error(`Eroare la ștergerea fișierului ${fisier.numeOriginal} din storage:`, storageError)
          fileDeleteSuccess = false
        }

        filesDeleteResults.push({
          fisier: {
            id: fisier.id,
            numeOriginal: fisier.numeOriginal,
            tipMime: fisier.tipMime,
            marime: Number(fisier.marime)
          },
          filePath,
          deletedFromStorage: fileDeleteSuccess
        })
      }
    }    // 2. Șterge înregistrarea din baza de date (fișierele se vor șterge automat prin CASCADE)
    await prisma.inregistrare.delete({
      where: { id }
    })
    
    console.log(`Înregistrarea ${deletedData.numarInregistrare} și ${inregistrareExistenta.fisiere.length} fișier(e) asociat(e) au fost șterse din baza de date prin CASCADE`)

    // Log ștergere reușită
    if (user) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.DELETE_INREGISTRARE,
        userId: user.id,
        entityType: 'INREGISTRARE',
        entityId: id,
        details: {
          success: true,
          inregistrareId: id,
          deletedInregistrareInfo: deletedData,
          cascadeDeletedFiles: deletedData.fisiere.length,
          filesDeleted: filesDeleteResults,
          physicalFilesDeleted: filesDeleteResults.filter(r => r.deletedFromStorage).length,
          physicalFilesNotFound: filesDeleteResults.filter(r => !r.deletedFromStorage).length,
          oldData: deletedData, // oldData conține datele înregistrării șterse
          newData: null // newData pentru DELETE este null
        }
      })
    }

    const successfulPhysicalDeletes = filesDeleteResults.filter(r => r.deletedFromStorage).length
    const failedPhysicalDeletes = filesDeleteResults.filter(r => !r.deletedFromStorage).length

    let message = `Înregistrarea "${deletedData.numarInregistrare}" a fost ștearsă cu succes`
    
    if (inregistrareExistenta.fisiere.length > 0) {
      message += ` împreună cu ${inregistrareExistenta.fisiere.length} fișier(e) asociat(e) din baza de date`
      
      if (successfulPhysicalDeletes > 0) {
        message += ` și ${successfulPhysicalDeletes} fișier(e) fizice din storage`
      }
      
      if (failedPhysicalDeletes > 0) {
        message += ` (${failedPhysicalDeletes} fișier(e) fizice nu au putut fi șterse din storage)`
      }
    }

    return NextResponse.json({
      success: true,
      message: message,
      details: {
        inregistrareDeleted: true,
        databaseFilesDeleted: inregistrareExistenta.fisiere.length,
        physicalFilesDeleted: successfulPhysicalDeletes,
        physicalFilesNotFound: failedPhysicalDeletes
      }
    })

  } catch (error) {
    console.error('Eroare la ștergerea înregistrării:', error)      // Log eroare de ștergere
    if (user) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.DELETE_INREGISTRARE,
        userId: user.id,
        entityType: 'INREGISTRARE',
        entityId: id || null,
        details: {
          success: false,
          error: 'Nu s-a putut șterge înregistrarea',
          errorDetails: error.message,
          inregistrareId: id || null
        }
      })
    }
    
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