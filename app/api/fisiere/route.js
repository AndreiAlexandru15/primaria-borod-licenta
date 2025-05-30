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

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// POST - Upload fișier
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const categorieId = formData.get('categorieId')
    const departamentId = formData.get('departamentId')
    const registruId = formData.get('registruId')

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nu a fost selectat niciun fișier' },
        { status: 400 }
      )
    }

    // Validare tip fișier
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipul de fișier nu este permis' },
        { status: 400 }
      )
    }

    // Validare mărime (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Fișierul este prea mare (max 10MB)' },
        { status: 400 }
      )
    }

    // Determină structura de directoare
    let uploadPath = 'uploads'
    
    if (departamentId && registruId) {
      // Obține numele departamentului și registrului pentru structura de foldere
      const departament = await prisma.departament.findUnique({
        where: { id: departamentId },
        select: { nume: true }
      })
      
      const registru = await prisma.registru.findUnique({
        where: { id: registruId },
        select: { nume: true }
      })

      if (departament && registru) {
        // Curăță numele pentru a fi safe pentru filesystem
        const departamentNume = departament.nume.replace(/[^a-zA-Z0-9\-_]/g, '_')
        const registruNume = registru.nume.replace(/[^a-zA-Z0-9\-_]/g, '_')
        uploadPath = `uploads/${departamentNume}/${registruNume}`
      }
    } else {
      // Fallback la structura cu an
      const currentYear = new Date().getFullYear()
      uploadPath = `uploads/${currentYear}`
    }

    // Creează directorul pentru upload dacă nu există
    const fullUploadDir = join(process.cwd(), uploadPath)
    if (!existsSync(fullUploadDir)) {
      await mkdir(fullUploadDir, { recursive: true })
    }    // Generează nume unic pentru fișier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Calculează hash pentru fișier
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    
    // Extrage extensia
    const originalName = file.name
    const extension = originalName.split('.').pop()
    
    // Generează nume fișier cu structura specificată
    let uniqueFileName
    const numarInregistrare = formData.get('numarInregistrare')
    const numeDocument = formData.get('numeDocument')
    
    if (numarInregistrare && numeDocument) {
      // Pentru editare: numarInregistrare_numeDocument.extensie
      const numeDocumentCurat = numeDocument.replace(/[^a-zA-Z0-9\-_]/g, '_')
      uniqueFileName = `${numarInregistrare}_${numeDocumentCurat}.${extension}`
    } else {
      // Pentru upload nou: nume unic cu timestamp
      uniqueFileName = `${Date.now()}_${crypto.randomUUID()}.${extension}`
    }
    const filePath = join(fullUploadDir, uniqueFileName)
    const relativePath = `${uploadPath}/${uniqueFileName}`

    // Salvează fișierul
    await writeFile(filePath, buffer)

    // Salvează în baza de date
    const fisierNou = await prisma.fisier.create({
      data: {
        numeOriginal: originalName,
        numeFisierDisk: uniqueFileName,
        extensie: extension,
        marime: BigInt(file.size),
        tipMime: file.type,
        hashFisier: hash,
        caleRelativa: relativePath,        
        categorieId: categorieId || null,
        // inregistrareId va fi setat când se creează înregistrarea
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: {
        id: fisierNou.id,
        numeOriginal: fisierNou.numeOriginal,
        marime: Number(fisierNou.marime),
        tipMime: fisierNou.tipMime,
        extensie: fisierNou.extensie
      },
      message: 'Fișierul a fost încărcat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la upload fișier:', error)
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
            obiect: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true
          }
        }      },
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
