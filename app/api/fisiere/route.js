/**
 * API pentru gestionarea fișierelor
 * @fileoverview Upload și management pentru fișiere documente
 */

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { AUDIT_ACTIONS, logFileAction, createAuditLogFromRequest } from '@/lib/audit'
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
    
    // Dacă avem deja user ID din header, îl folosim
    if (userId) {
      return userId
    }
    
    // Altfel, încercăm să extragem din cookie
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
      select: { id: true, nume: true, email: true }
    })
    
    return user
  } catch (error) {
    console.error('Eroare la verificarea token-ului:', error)
    return null
  }
}

// Helper function pentru a sanitiza numele de foldere
function sanitizeFolderName(name) {
  if (!name) return 'Necategorizat'
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
}

// POST - Upload fișier
export async function POST(request) {
  try {
    const userId = await getUserIdFromToken(request)
    const formData = await request.formData()
    const file = formData.get('file')
    const categorieId = formData.get('categorieId')
    const departamentId = formData.get('departamentId')
    const isReplacement = formData.get('isReplacement') === 'true'
    const existingFilePath = formData.get('existingFilePath')
    const existingFileId = formData.get('existingFileId')
    const inregistrareId = formData.get('inregistrareId')
    
    if (!file) {
      // Log încercarea eșuată de upload fișier
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.UPLOAD_FILE,
          userId: userId,
          success: false,
          details: {
            error: 'Nu a fost selectat niciun fișier',
            categorieId,
            departamentId,
            inregistrareId
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Nu a fost selectat niciun fișier' },
        { status: 400 }
      )
    }

    // Validare tip fișier
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      // Log încercare de upload cu tip neacceptat
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.UPLOAD_FILE,
          userId: userId,
          success: false,
          details: {
            error: 'Tip de fișier neacceptat',
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            categorieId,
            departamentId,
            inregistrareId
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Tip de fișier neacceptat' },
        { status: 400 }
      )
    }

    // Validare mărime fișier (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      // Log încercare de upload cu fișier prea mare
      if (userId) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.UPLOAD_FILE,
          userId: userId,
          success: false,
          details: {
            error: 'Fișierul este prea mare (max 10MB)',
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            maxSize,
            categorieId,
            departamentId,
            inregistrareId
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Fișierul este prea mare (max 10MB)' },
        { status: 400 }
      )
    }

    // Obținere informații departament și categorie pentru structura de foldere
    let departamentNume = 'Necategorizat'
    let categorieNume = 'General'

    if (departamentId) {
      const departament = await prisma.departament.findUnique({
        where: { id: departamentId },
        select: { nume: true }
      })
      if (departament) {
        departamentNume = departament.nume
      }
    }

    if (categorieId) {
      const categorie = await prisma.categorieDocument.findUnique({
        where: { id: categorieId },
        select: { nume: true }
      })
      if (categorie) {
        categorieNume = categorie.nume
      }
    }    // Generare nume unic pentru fișier
    const fileExtension = file.name.split('.').pop()
    const uniqueId = crypto.randomUUID()
    const uniqueFileName = `${uniqueId}.${fileExtension}`

    // Determină calea folderului
    let folderStructure
    let fullFolderPath
    let filePath
    let caleRelativaNormalizata

    if (isReplacement && existingFilePath) {
      // Pentru înlocuire, folosește folderul existent
      console.log('File replacement detected, using existing folder:', existingFilePath)
      folderStructure = existingFilePath
      caleRelativaNormalizata = existingFilePath
      
      const basePath = process.env.FILES_PATH || './storage/files'
      fullFolderPath = join(basePath, folderStructure)
      filePath = join(fullFolderPath, uniqueFileName)
      
      console.log('Using existing folder structure:', {
        existingFilePath,
        folderStructure,
        fullFolderPath,
        filePath
      })
    } else {
      // Pentru fișiere noi, creează structură bazată pe An/Departament/Categorie
      const now = new Date()
      const year = now.getFullYear().toString()
      
      // Sanitizare nume foldere
      const sanitizedDepartament = sanitizeFolderName(departamentNume)
      const sanitizedCategorie = sanitizeFolderName(categorieNume)

      // Construire cale folosind FILES_PATH din .env
      const basePath = process.env.FILES_PATH || './storage/files'
      folderStructure = join(year, sanitizedDepartament, sanitizedCategorie)
      fullFolderPath = join(basePath, folderStructure)
      filePath = join(fullFolderPath, uniqueFileName)

      // Normalizare cale pentru cross-platform (folosește slash-uri forward)
      caleRelativaNormalizata = folderStructure.replace(/\\/g, '/')
        console.log('Creating new folder structure:', {
        year,
        departamentNume,
        categorieNume,
        folderStructure,
        fullFolderPath
      })
    }

    // Creare foldere dacă nu există
    if (!existsSync(fullFolderPath)) {
      await mkdir(fullFolderPath, { recursive: true })
    }

    // Salvare fișier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generare hash pentru fișier
    const hashFisier = crypto.createHash('sha256').update(buffer).digest('hex')

    // Pentru data fișierului - folosește data curentă
    const now = new Date()    // Salvare în baza de date - cu toate câmpurile obligatorii
    const fisier = await prisma.fisier.create({
      data: {
        numeOriginal: file.name,
        numeFisierDisk: uniqueFileName,
        caleRelativa: caleRelativaNormalizata,
        extensie: fileExtension,
        tipMime: file.type,
        marime: BigInt(file.size),
        hashFisier: hashFisier,
        dataFisier: now,
        categorieId: categorieId || null,
        // Câmpuri opționale cu valori default
        scanat: false,
        ocrProcesat: false,
        confidentialitate: 'public',
        prioritate: 'normala',
        // Adaugă câmpuri opționale din schema
        subiect: file.name,
        continutText: null,
        miniaturaPath: null,
        termene: null,
        codBare: null,
        qrCode: null,
        metadate: {
          folderPath: caleRelativaNormalizata,
          originalPath: `${caleRelativaNormalizata}/${uniqueFileName}`,
          uploadedAt: now.toISOString(),
          departament: departamentNume,
          categorieNume: categorieNume,
          fullPath: filePath.replace(/\\/g, '/') // pentru debugging
        }
      },
      include: {
        inregistrare: {
          select: {
            id: true,
            numarInregistrare: true,
            obiect: true,
            dataInregistrare: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        }
      }
    })

    // Log upload reușit
    if (userId) {
      await logFileAction(
        AUDIT_ACTIONS.UPLOAD_FILE,
        userId,
        fisier.id,
        {
          success: true,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          hashFisier,
          categorieId,
          departamentId,
          inregistrareId,
          folderPath: caleRelativaNormalizata,
          isReplacement,
          existingFileId: existingFileId || null,
          departamentNume,
          categorieNume
        },
        request
      )
    }
    
    return NextResponse.json(serializeBigInt({
      success: true,
      data: {
        ...fisier,
        marime: Number(fisier.marime)
      },
      message: 'Fișierul a fost încărcat cu succes',
      folderPath: caleRelativaNormalizata
    }))

  } catch (error) {
    console.error('Eroare la încărcarea fișierului:', error)
    
    // Log eroare de upload
    if (userId) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.UPLOAD_FILE,
        userId: userId,
        success: false,
        details: {
          error: 'Nu s-a putut încărca fișierul',
          errorDetails: error.message,
          categorieId,
          departamentId,
          inregistrareId
        }
      })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut încărca fișierul',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Listează fișierele
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const inregistrareId = searchParams.get('inregistrareId')
    const categorieId = searchParams.get('categorieId')
    const neatribuite = searchParams.get('neatribuite') === 'true'

    const where = {}
    
    if (inregistrareId) {
      where.inregistrareId = inregistrareId
    } else if (neatribuite) {
      where.inregistrareId = null
    }
    
    if (categorieId) {
      where.categorieId = categorieId
    }

    const fisiere = await prisma.fisier.findMany({
      where,
      include: {
        inregistrare: {
          select: {
            id: true,
            numarInregistrare: true,
            obiect: true,
            dataInregistrare: true,
            expeditor: true,
            destinatar: true,
            urgent: true,
            confidential: true,
            status: true,
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
        },
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true,
            descriere: true,
            perioadaRetentie: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: fisiere.map(fisier => ({
        ...fisier,
        marime: Number(fisier.marime)
      }))
    }))

  } catch (error) {
    console.error('Eroare la listarea fișierelor:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-au putut lista fișierele',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizează fișier
export async function PUT(request) {
  const user = await getUserFromToken(request)
  
  try {
    const body = await request.json()
    const { id, subiect, categorieId, confidentialitate, prioritate } = body;
    if (!id) {
      // Log încercare de actualizare fără ID
      if (user) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.UPDATE_FILE,
          userId: user.id,
          details: {
            success: false,
            error: 'ID-ul fișierului este obligatoriu',
            requestData: body
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'ID-ul fișierului este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă fișierul există
    const fisierExistent = await prisma.fisier.findUnique({
      where: { id },
      include: {
        categorie: { select: { id: true, nume: true } }
      }
    })    
    if (!fisierExistent) {
      // Log încercare de actualizare pentru fișier inexistent
      if (user) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.UPDATE_FILE,
          userId: user.id,
          entityType: 'FISIER',
          entityId: id,
          details: {
            success: false,
            error: 'Fișierul specificat nu există',
            fisierId: id,
            requestData: body
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Fișierul specificat nu există' },
        { status: 404 }
      )
    }

    // Verifică dacă categoria există (dacă este specificată)
    if (categorieId) {
      const categorie = await prisma.categorieDocument.findUnique({
        where: { id: categorieId }
      })
      if (!categorie) {
        // Log încercare de actualizare cu categorie inexistentă
        if (user) {
          await logFileAction(
            AUDIT_ACTIONS.UPDATE_FILE,
            user.id,
            id,
            {
              success: false,
              error: 'Categoria specificată nu există',
              categorieId,
              requestData: body
            },
            request
          )
        }
        
        return NextResponse.json(
          { success: false, error: 'Categoria specificată nu există' },
          { status: 400 }
        )
      }
    }

    // Salvare date vechi pentru audit
    const oldData = {
      subiect: fisierExistent.subiect,
      categorieId: fisierExistent.categorieId,
      confidentialitate: fisierExistent.confidentialitate,
      prioritate: fisierExistent.prioritate
    }

    const fisierActualizat = await prisma.fisier.update({
      where: { id },
      data: {
        subiect: subiect?.trim() || null,
        categorieId: categorieId || null,
        confidentialitate: confidentialitate || 'PUBLICA',
        prioritate: prioritate || 'NORMALA'
      },
      include: {
        inregistrare: {
          select: {
            id: true,
            numarInregistrare: true,
            obiect: true,
            dataInregistrare: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        }
      }
    })

    // Log actualizare reușită
    if (user) {
      await logFileAction(
        AUDIT_ACTIONS.UPDATE_FILE,
        user.id,
        id,
        {
          success: true,
          oldData,
          newData: {
            subiect: fisierActualizat.subiect,
            categorieId: fisierActualizat.categorieId,
            confidentialitate: fisierActualizat.confidentialitate,
            prioritate: fisierActualizat.prioritate
          },
          fileName: fisierActualizat.numeOriginal,
          changes: {
            subiect: oldData.subiect !== fisierActualizat.subiect,
            categorieId: oldData.categorieId !== fisierActualizat.categorieId,
            confidentialitate: oldData.confidentialitate !== fisierActualizat.confidentialitate,
            prioritate: oldData.prioritate !== fisierActualizat.prioritate
          }
        },
        request
      )
    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data: {
        ...fisierActualizat,
        marime: Number(fisierActualizat.marime)
      },
      message: 'Fișierul a fost actualizat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la actualizarea fișierului:', error)
    
    // Log eroare de actualizare
    if (user) {
      await logGeneralAction(
        AUDIT_ACTIONS.UPDATE_FILE,
        user.id,
        {
          success: false,
          error: 'Nu s-a putut actualiza fișierul',
          errorDetails: error.message,
          fisierId: body?.id || null
        },
        request
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza fișierul',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Șterge fișier
export async function DELETE(request) {
  const user = await getUserFromToken(request)
  let id = null
  try {
    const { searchParams } = new URL(request.url)
    id = searchParams.get('id')

    if (!id) {
      // Log încercare de ștergere fără ID
      if (user) {
        await logFileAction(
          AUDIT_ACTIONS.DELETE_FILE,
          user.id,
          null,
          {
            success: false,
            error: 'ID-ul fișierului este obligatoriu'
          },
          request
        )
      }
      return NextResponse.json(
        { success: false, error: 'ID-ul fișierului este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă fișierul există
    const fisierExistent = await prisma.fisier.findUnique({
      where: { id },
      include: {
        inregistrare: {
          select: {
            id: true,
            numarInregistrare: true,
            obiect: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true
          }
        }
      }
    })

    if (!fisierExistent) {
      // Log încercare de ștergere pentru fișier inexistent
      if (user) {
        await logFileAction(
          AUDIT_ACTIONS.DELETE_FILE,
          user.id,
          id,
          {
            success: false,
            error: 'Fișierul specificat nu există'
          },
          request
        )
      }
      return NextResponse.json(
        { success: false, error: 'Fișierul specificat nu există' },
        { status: 404 }
      )
    }

    // Salvare informații pentru audit înainte de ștergere
    const fileInfo = {
      id: fisierExistent.id,
      numeOriginal: fisierExistent.numeOriginal,
      numeFisierDisk: fisierExistent.numeFisierDisk,
      caleRelativa: fisierExistent.caleRelativa,
      extensie: fisierExistent.extensie,
      tipMime: fisierExistent.tipMime,
      marime: Number(fisierExistent.marime),
      hashFisier: fisierExistent.hashFisier,
      categorieId: fisierExistent.categorieId,
      categorieNume: fisierExistent.categorie?.nume || null,
      inregistrareId: fisierExistent.inregistrareId,
      inregistrareNumar: fisierExistent.inregistrare?.numarInregistrare || null,
      confidentialitate: fisierExistent.confidentialitate,
      prioritate: fisierExistent.prioritate
    }

    // Șterge fișierul fizic folosind metadatele
    const basePath = process.env.FILES_PATH || './storage/files'
    let fullFilePath
    let fileDeleteSuccess = false
    if (fisierExistent.metadate?.fullPath) {
      fullFilePath = fisierExistent.metadate.fullPath
    } else if (fisierExistent.caleRelativa) {
      fullFilePath = join(basePath, fisierExistent.caleRelativa, fisierExistent.numeFisierDisk)
    } else {
      fullFilePath = join(basePath, fisierExistent.numeFisierDisk)
    }
    try {
      const { unlink } = await import('fs/promises')
      if (existsSync(fullFilePath)) {
        await unlink(fullFilePath)
        fileDeleteSuccess = true
      }
    } catch (fileError) {
      console.warn('Nu s-a putut șterge fișierul fizic:', fileError.message)
    }

    // Șterge din baza de date
    await prisma.fisier.delete({ where: { id } })

    // Log ștergere reușită
    if (user) {
      await logFileAction(
        AUDIT_ACTIONS.DELETE_FILE,
        user.id,
        id,
        {
          success: true,
          deletedFileInfo: fileInfo,
          physicalFileDeleted: fileDeleteSuccess,
          filePath: fullFilePath
        },
        request
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Fișierul a fost șters cu succes'
    })
  } catch (error) {
    console.error('Eroare la ștergerea fișierului:', error)
    // Log eroare de ștergere
    if (user) {
      await logFileAction(
        AUDIT_ACTIONS.DELETE_FILE,
        user.id,
        id || null,
        {
          success: false,
          error: 'Nu s-a putut șterge fișierul',
          errorDetails: error.message
        },
        request
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Nu s-a putut șterge fișierul',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PATCH - Asociază fișier cu înregistrare
export async function PATCH(request) {
  const user = await getUserFromToken(request)
  
  try {
    const body = await request.json()
    const { fisiereIds, inregistrareId } = body

    if (!Array.isArray(fisiereIds) || fisiereIds.length === 0) {
      // Log încercare de asociere fără fișiere
      if (user) {
        await logGeneralAction(
          AUDIT_ACTIONS.ASSOCIATE_FILE,
          user.id,
          {
            success: false,
            error: 'Lista de fișiere este obligatorie',
            fisiereIds,
            inregistrareId
          },
          request
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Lista de fișiere este obligatorie' },
        { status: 400 }
      )
    }

    if (!inregistrareId) {
      // Log încercare de asociere fără înregistrare
      if (user) {
        await logGeneralAction(
          AUDIT_ACTIONS.ASSOCIATE_FILE,
          user.id,
          {
            success: false,
            error: 'ID-ul înregistrării este obligatoriu',
            fisiereIds,
            inregistrareId
          },
          request
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'ID-ul înregistrării este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă înregistrarea există
    const inregistrare = await prisma.inregistrare.findUnique({
      where: { id: inregistrareId },
      select: {
        id: true,
        numarInregistrare: true,
        obiect: true,
        registru: {
          select: {
            id: true,
            nume: true,
            departament: {
              select: {
                id: true,
                nume: true
              }
            }
          }
        }
      }
    })

    if (!inregistrare) {
      // Log încercare de asociere cu înregistrare inexistentă
      if (user) {
        await logGeneralAction(
          AUDIT_ACTIONS.ASSOCIATE_FILE,
          user.id,
          {
            success: false,
            error: 'Înregistrarea specificată nu există',
            fisiereIds,
            inregistrareId
          },
          request
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Înregistrarea specificată nu există' },
        { status: 404 }
      )
    }

    // Obține informații despre fișierele care vor fi asociate
    const fisiereDeAsos = await prisma.fisier.findMany({
      where: {
        id: { in: fisiereIds },
        inregistrareId: null // Doar fișierele neatribuite
      },
      select: {
        id: true,
        numeOriginal: true,
        tipMime: true,
        marime: true,
        categorieId: true,
        categorie: {
          select: {
            id: true,
            nume: true
          }
        }
      }
    })

    // Actualizează fișierele să fie asociate cu înregistrarea
    const fisiereleActualizate = await prisma.fisier.updateMany({
      where: {
        id: { in: fisiereIds },
        inregistrareId: null // Doar fișierele neatribuite
      },
      data: {
        inregistrareId: inregistrareId
      }
    })

    // Log asociere reușită
    if (user && fisiereleActualizate.count > 0) {
      await logGeneralAction(
        AUDIT_ACTIONS.ASSOCIATE_FILE,
        user.id,
        {
          success: true,
          filesAssociated: fisiereleActualizate.count,
          totalFilesRequested: fisiereIds.length,
          fisiereIds,
          inregistrareId,
          inregistrareNumar: inregistrare.numarInregistrare,
          inregistrareObiect: inregistrare.obiect,
          registruNume: inregistrare.registru?.nume,
          departamentNume: inregistrare.registru?.departament?.nume,
          filesInfo: fisiereDeAsos.map(f => ({
            id: f.id,
            nume: f.numeOriginal,
            tipMime: f.tipMime,
            marime: Number(f.marime),
            categorieNume: f.categorie?.nume
          }))
        },
        request
      )
    }

    return NextResponse.json({
      success: true,
      message: `${fisiereleActualizate.count} fișiere au fost asociate cu înregistrarea`,
      data: {
        count: fisiereleActualizate.count,
        inregistrareId,
        inregistrareNumar: inregistrare.numarInregistrare
      }
    })

  } catch (error) {
    console.error('Eroare la asocierea fișierelor:', error)
    
    // Log eroare de asociere
    if (user) {
      await logGeneralAction(
        AUDIT_ACTIONS.ASSOCIATE_FILE,
        user.id,
        {
          success: false,
          error: 'Nu s-au putut asocia fișierele',
          errorDetails: error.message,
          fisiereIds: body?.fisiereIds || null,
          inregistrareId: body?.inregistrareId || null
        },
        request
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-au putut asocia fișierele',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}