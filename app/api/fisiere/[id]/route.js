/**
 * API pentru gestionarea operațiilor pe fișiere individuale
 * @fileoverview Endpoint pentru CRUD pe fișiere specifice
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { mkdir, copyFile } from 'fs/promises'
import crypto from 'crypto'

// Funcție helper pentru sanitizarea numelor de foldere
function sanitizeFolderName(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Înlocuiește caracterele interzise cu _
    .replace(/\s+/g, '_') // Înlocuiește spațiile cu _
    .replace(/_+/g, '_') // Înlocuiește _ multiple cu unul singur
    .replace(/^_|_$/g, '') // Elimină _ de la început și sfârșit
}

/**
 * PATCH /api/fisiere/[id] - Actualizează categoria unui fișier și îl mută în structura corectă
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const { categorieId, departamentId } = await request.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ID-ul fișierului este invalid' },
        { status: 400 }
      )
    }

    if (!categorieId) {
      return NextResponse.json(
        { success: false, error: 'Categoria este obligatorie' },
        { status: 400 }
      )
    }

    // Găsește fișierul existent
    const fisier = await prisma.fisier.findUnique({
      where: { id: id },
      include: {
        categorie: true
      }
    })

    if (!fisier) {
      return NextResponse.json(
        { success: false, error: 'Fișierul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Obține informații despre noua categorie și departament
    const categorie = await prisma.categorieDocument.findUnique({
      where: { id: categorieId },
      select: { nume: true }
    })

    if (!categorie) {
      return NextResponse.json(
        { success: false, error: 'Categoria nu a fost găsită' },
        { status: 404 }
      )
    }

    let departamentNume = 'Necategorizat'
    if (departamentId) {
      const departament = await prisma.departament.findUnique({
        where: { id: departamentId },
        select: { nume: true }
      })
      if (departament) {
        departamentNume = departament.nume
      }
    }

    // Construire noua structură de foldere
    const now = new Date()
    const year = now.getFullYear().toString()
    const sanitizedDepartament = sanitizeFolderName(departamentNume)
    const sanitizedCategorie = sanitizeFolderName(categorie.nume)

    const basePath = process.env.FILES_PATH || './storage/files'
    const newFolderStructure = join(year, sanitizedDepartament, sanitizedCategorie)
    const newFullFolderPath = join(basePath, newFolderStructure)
    const newFilePath = join(newFullFolderPath, fisier.numeFisierDisk)

    // Cale veche
    const oldFilePath = join(basePath, fisier.caleRelativa || '', fisier.numeFisierDisk)

    // Verifică dacă fișierul trebuie mutat
    const newCaleRelativaNormalizata = newFolderStructure.replace(/\\/g, '/')
    const needsMove = fisier.caleRelativa !== newCaleRelativaNormalizata

    if (needsMove && existsSync(oldFilePath)) {
      // Crează folderul nou dacă nu există
      if (!existsSync(newFullFolderPath)) {
        await mkdir(newFullFolderPath, { recursive: true })
      }

      // Mută fișierul
      await copyFile(oldFilePath, newFilePath)
      
      // Șterge fișierul vechi
      await unlink(oldFilePath)
    }

    // Actualizează baza de date
    const fisierActualizat = await prisma.fisier.update({
      where: { id: id },
      data: {
        categorieId: categorieId,
        caleRelativa: newCaleRelativaNormalizata,
        dataFisier: now // Actualizează data modificării
      },
      include: {
        categorie: {
          select: {
            id: true,
            nume: true,
            descriere: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Fișierul a fost actualizat cu succes',
      data: {
        id: fisierActualizat.id,
        numeOriginal: fisierActualizat.numeOriginal,
        marime: Number(fisierActualizat.marime),
        tipMime: fisierActualizat.tipMime,
        extensie: fisierActualizat.extensie,
        categorie: fisierActualizat.categorie,
        caleRelativa: fisierActualizat.caleRelativa,
        dataFisier: fisierActualizat.dataFisier
      }
    })

  } catch (error) {
    console.error('Eroare la actualizarea fișierului:', error)
    return NextResponse.json(
      { success: false, error: 'Eroare internă la actualizarea fișierului' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/fisiere/[id] - Șterge un fișier din baza de date și din storage
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ID-ul fișierului este invalid' },
        { status: 400 }
      )
    }    // Găsește fișierul în baza de date
    const fisier = await prisma.fisier.findUnique({
      where: { id: id },
      select: {
        id: true,
        numeOriginal: true,
        numeFisierDisk: true,
        caleRelativa: true,
        inregistrareId: true
      }
    })

    if (!fisier) {
      return NextResponse.json(
        { success: false, error: 'Fișierul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Șterge din storage fizic
    if (fisier.caleRelativa && fisier.numeFisierDisk) {
      // Construire cale completă folosind FILES_PATH din .env
      const basePath = process.env.FILES_PATH || './storage/files'
      const filePath = join(basePath, fisier.caleRelativa, fisier.numeFisierDisk)
      
      try {
        if (existsSync(filePath)) {
          await unlink(filePath)
          console.log(`Fișier șters din storage: ${filePath}`)
        } else {
          console.warn(`Fișierul nu există în storage: ${filePath}`)
        }
      } catch (error) {
        console.error('Eroare la ștergerea fișierului din storage:', error)
        // Continuă cu ștergerea din DB chiar dacă fișierul fizic nu poate fi șters
      }
    }

    // Verifică dacă fișierul este atașat la o înregistrare (doar pentru logging)
    if (fisier.inregistrareId) {
      console.warn(`Ștergere fișier care este atașat la înregistrarea: ${fisier.inregistrareId}`)
    }    // Șterge din baza de date
    await prisma.fisier.delete({
      where: { id: id }
    })

    console.log(`Fișier șters cu succes din DB: ${fisier.numeOriginal} (ID: ${id})`)

    return NextResponse.json({
      success: true,
      message: `Fișierul "${fisier.numeOriginal}" a fost șters cu succes din baza de date și storage`
    })

  } catch (error) {
    console.error('Eroare la ștergerea fișierului:', error)
    return NextResponse.json(
      { success: false, error: 'Eroare internă la ștergerea fișierului' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * GET /api/fisiere/[id] - Obține informații despre un fișier
 */
export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ID-ul fișierului este invalid' },
        { status: 400 }
      )
    }    const fisier = await prisma.fisier.findUnique({
      where: { id: id },
      select: {
        id: true,
        numeOriginal: true,
        numeFisierDisk: true,
        extensie: true,
        marime: true,
        tipMime: true,
        caleRelativa: true,
        dataCreare: true,
        dataFisier: true,
        inregistrareId: true
      }
    })

    if (!fisier) {
      return NextResponse.json(
        { success: false, error: 'Fișierul nu a fost găsit' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...fisier,
        marime: Number(fisier.marime) // Convertește BigInt la număr
      }
    })

  } catch (error) {
    console.error('Eroare la obținerea fișierului:', error)
    return NextResponse.json(
      { success: false, error: 'Eroare internă la obținerea fișierului' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
