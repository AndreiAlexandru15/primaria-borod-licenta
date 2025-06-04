/**
 * API Route pentru gestionarea utilizatorilor
 * @fileoverview CRUD operations pentru utilizatori în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { AUDIT_ACTIONS, createAuditLogFromRequest } from '@/lib/audit'

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

    console.log('POST /api/utilizatori - Headers:', {
      userId,
      primariaId,
      hasAuth: !!userId && !!primariaId
    })

    if (!userId || !primariaId) {
      console.log('Authentication failed - missing headers')
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('POST /api/utilizatori - Request body:', {
      ...body,
      parola: body.parola ? '[HIDDEN]' : undefined
    })

    const { nume, prenume, email, functie, telefon, parola, departamentId } = body

    // Validare date obligatorii
    if (!nume || !prenume || !email || !parola) {
      console.log('Validation failed - missing required fields:', {
        hasNume: !!nume,
        hasPrenume: !!prenume,
        hasEmail: !!email,
        hasParola: !!parola
      })
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
    })    // Dacă a fost specificat un departament, asociază utilizatorul
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

    // Log audit pentru crearea utilizatorului
    await createAuditLogFromRequest(request, {
      action: AUDIT_ACTIONS.CREATE_USER,
      userId: userId,
      entityType: 'USER',
      entityId: newUser.id,
      details: {
        nume: newUser.nume,
        prenume: newUser.prenume,
        email: newUser.email,
        functie: newUser.functie,
        departamentId: departamentId || null,
        success: true
      }
    })

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Utilizator creat cu succes'
    })  } catch (error) {
    console.error('Eroare la crearea utilizatorului:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    })
    
    // Log audit pentru eroarea de creare
    try {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_USER,
        userId: userId,
        entityType: 'USER',
        details: {
          success: false,
          error: error.message,
          email: body?.email || 'unknown'
        }
      })
    } catch (auditError) {
      console.error('Eroare la logarea auditului:', auditError)
    }
    
    // Return more specific error information for debugging
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email-ul este deja folosit de alt utilizator' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Eroare internă de server', details: error.message },
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
    }    // Dezactivează utilizatorul în loc să îl ștergi
    await prisma.utilizator.update({
      where: { id: userIdToDelete },
      data: { activ: false }
    })

    // Log audit pentru dezactivarea utilizatorului
    await createAuditLogFromRequest(request, {
      action: AUDIT_ACTIONS.DELETE_USER,
      userId: userId,
      entityType: 'USER',
      entityId: userIdToDelete,
      details: {
        nume: user.nume,
        prenume: user.prenume,
        email: user.email,
        action: 'deactivated',
        success: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Utilizator dezactivat cu succes'
    })
  } catch (error) {
    console.error('Eroare la ștergerea utilizatorului:', error)
    
    // Log audit pentru eroarea de ștergere
    try {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.DELETE_USER,
        userId: userId,
        entityType: 'USER',
        details: {
          success: false,
          error: error.message,
          targetUserId: userIdToDelete || 'unknown'
        }
      })
    } catch (auditError) {
      console.error('Eroare la logarea auditului:', auditError)
    }
    
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
