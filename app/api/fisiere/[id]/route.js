/**
 * API pentru gestionarea operațiilor pe fișiere individuale
 * @fileoverview Endpoint pentru CRUD pe fișiere specifice
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
    if (fisier.caleRelativa) {
      const filePath = join(process.cwd(), fisier.caleRelativa)
      try {
        if (existsSync(filePath)) {
          await unlink(filePath)
          console.log(`Fișier șters din storage: ${filePath}`)
        }
      } catch (error) {
        console.error('Eroare la ștergerea fișierului din storage:', error)
        // Continuă cu ștergerea din DB chiar dacă fișierul fizic nu poate fi șters
      }
    }    // Șterge din baza de date
    await prisma.fisier.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: `Fișierul "${fisier.numeOriginal}" a fost șters cu succes`
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
