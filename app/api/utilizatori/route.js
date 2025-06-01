/**
 * API Route pentru gestionarea utilizatorilor
 * @fileoverview CRUD operations pentru utilizatori în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

/**
 * GET /api/utilizatori
 * Obține toți utilizatorii pentru primăria curentă
 */
export async function GET(request) {
  try {    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    // Obține utilizatorii pentru primăria curentă
    const utilizatori = await prisma.utilizator.findMany({
      where: {
        primariaId: primariaId,
        activ: true
      },
      select: {
        id: true,
        nume: true,
        prenume: true,
        email: true,
        functie: true,
        telefon: true,
        departamente: {
          where: {
            activ: true
          },
          include: {
            departament: {
              select: {
                id: true,
                nume: true,
                cod: true
              }
            }
          }
        },
        _count: {
          select: {
            departamente: {
              where: {
                activ: true
              }
            }
          }
        }
      },
      orderBy: [
        { nume: 'asc' },
        { prenume: 'asc' }
      ]
    })    
    return NextResponse.json(serializeBigInt({
      success: true,
      data: utilizatori
    }))

  } catch (error) {
    console.error('Eroare la obținerea utilizatorilor:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/utilizatori
 * Creează un utilizator nou
 */
export async function POST(request) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nume, prenume, email, functie, telefon, parola, departamentId } = body

    // Validare date obligatorii
    if (!nume || !prenume || !email || !parola) {
      return NextResponse.json(
        { error: 'Nume, prenume, email și parola sunt obligatorii' },
        { status: 400 }
      )
    }

    // Verifică dacă email-ul este deja folosit
    const existingUser = await prisma.utilizator.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Adresa de email este deja folosită' },
        { status: 400 }
      )
    }

    // Hash parola
    const parolaHash = await bcrypt.hash(parola, 12)

    // Creează utilizatorul
    const newUser = await prisma.utilizator.create({
      data: {
        nume,
        prenume,
        email,
        functie,
        telefon,
        parolaHash,
        primariaId,
        activ: true,
        emailVerificat: false,
        preferinte: {}
      },
      select: {
        id: true,
        nume: true,
        prenume: true,
        email: true,
        functie: true,
        telefon: true,
        activ: true
      }
    })

    // Dacă a fost specificat un departament, asociază utilizatorul
    if (departamentId) {
      await prisma.utilizatorDepartament.create({
        data: {
          utilizatorId: newUser.id,
          departamentId,
          rolDepartament: 'membru',
          activ: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Utilizator creat cu succes'
    })

  } catch (error) {
    console.error('Eroare la crearea utilizatorului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/utilizatori/:id
 * Șterge un utilizator (dezactivare)
 */
export async function DELETE(request) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const userIdToDelete = url.searchParams.get('id')

    if (!userIdToDelete) {
      return NextResponse.json(
        { error: 'ID utilizator lipsește' },
        { status: 400 }
      )
    }

    // Verifică dacă utilizatorul există și aparține aceleiași primării
    const user = await prisma.utilizator.findFirst({
      where: {
        id: userIdToDelete,
        primariaId
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Dezactivează utilizatorul în loc să îl ștergi
    await prisma.utilizator.update({
      where: { id: userIdToDelete },
      data: { activ: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Utilizator dezactivat cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea utilizatorului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
