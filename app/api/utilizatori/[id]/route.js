/**
 * API Route pentru gestionarea operațiunilor pe utilizatori individuali
 * @fileoverview UPDATE operations pentru utilizatori în aplicația e-registratură
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
 * GET /api/utilizatori/[id]
 * Obține detaliile unui utilizator specific
 */
export async function GET(request, { params }) {
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

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID utilizator lipsește' },
        { status: 400 }
      )
    }

    // Obține utilizatorul cu toate relațiile
    const utilizator = await prisma.utilizator.findFirst({
      where: {
        id: id,
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
        activ: true,
        emailVerificat: true,
        createdAt: true,
        updatedAt: true,
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
        roluri: {
          where: {
            activ: true
          },
          include: {
            rol: {
              select: {
                id: true,
                nume: true,
                descriere: true
              }
            }
          }
        }
      }
    })

    if (!utilizator) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data: utilizator
    }))

  } catch (error) {
    console.error('Eroare la obținerea utilizatorului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/utilizatori/[id]
 * Actualizează un utilizator existent
 */
export async function PUT(request, { params }) {
  let userId = null;
  let id = null;
  
  try {
    const headersList = await headers()
    userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const paramsResolved = await params;
    id = paramsResolved.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID utilizator lipsește' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { nume, prenume, email, functie, telefon, parola, departamentId } = body

    // Verifică dacă utilizatorul există și aparține aceleiași primării
    const existingUser = await prisma.utilizator.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      },
      include: {
        departamente: {
          where: { activ: true },
          include: {
            departament: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică dacă email-ul este deja folosit de alt utilizator
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.utilizator.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Adresa de email este deja folosită' },
          { status: 400 }
        )
      }
    }

    // Salvează datele vechi pentru audit
    const oldData = {
      nume: existingUser.nume,
      prenume: existingUser.prenume,
      email: existingUser.email,
      functie: existingUser.functie,
      telefon: existingUser.telefon,
      departamente: existingUser.departamente.map(d => ({
        id: d.departament.id,
        nume: d.departament.nume
      }))
    }

    // Construiește obiectul de actualizare
    const updateData = {
      ...(nume && { nume }),
      ...(prenume && { prenume }),
      ...(email && { email }),
      ...(functie && { functie }),
      ...(telefon && { telefon }),
      updatedAt: new Date()
    }

    // Hash parola nouă dacă este furnizată
    if (parola) {
      updateData.parolaHash = await bcrypt.hash(parola, 12)
    }

    // Actualizează utilizatorul
    const updatedUser = await prisma.utilizator.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        nume: true,
        prenume: true,
        email: true,
        functie: true,
        telefon: true,
        activ: true,
        updatedAt: true
      }
    })    // Gestionează asocierea cu departamentul
    if (departamentId !== undefined) {
      // Dezactivează toate asocierile existente
      await prisma.utilizatorDepartament.updateMany({
        where: {
          utilizatorId: id,
          activ: true
        },
        data: { activ: false }
      })

      // Creează sau reactualizează asocierea dacă departamentId nu este null
      if (departamentId) {
        await prisma.utilizatorDepartament.upsert({
          where: {
            utilizatorId_departamentId: {
              utilizatorId: id,
              departamentId: departamentId
            }
          },
          update: {
            activ: true,
            rolDepartament: 'membru'
          },
          create: {
            utilizatorId: id,
            departamentId,
            rolDepartament: 'membru',
            activ: true
          }
        })
      }
    }

    // Pregătește datele noi pentru audit
    const newData = {
      nume: updatedUser.nume,
      prenume: updatedUser.prenume,
      email: updatedUser.email,
      functie: updatedUser.functie,
      telefon: updatedUser.telefon,
      departamentId: departamentId || null,
      parolaChanged: !!parola
    }

    // Log audit pentru actualizarea utilizatorului
    await createAuditLogFromRequest(request, {
      action: AUDIT_ACTIONS.UPDATE_USER,
      userId: userId,
      entityType: 'USER',
      entityId: id,
      details: {
        oldData,
        newData,
        changes: Object.keys(updateData).filter(key => key !== 'updatedAt'),
        success: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Utilizator actualizat cu succes'
    })
  } catch (error) {
    console.error('Eroare la actualizarea utilizatorului:', error)
    
    // Log audit pentru eroarea de actualizare
    try {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.UPDATE_USER,
        userId: userId,
        entityType: 'USER',
        entityId: id || 'unknown',
        details: {
          success: false,
          error: error.message
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

/**
 * DELETE /api/utilizatori/[id]
 * Șterge (dezactivează) un utilizator specific
 */
export async function DELETE(request, { params }) {
  let userId = null;
  let id = null;
  
  try {
    const headersList = await headers()
    userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const paramsResolved = await params;
    id = paramsResolved.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID utilizator lipsește' },
        { status: 400 }
      )
    }

    // Verifică dacă utilizatorul există și aparține aceleiași primării
    const user = await prisma.utilizator.findFirst({
      where: {
        id: id,
        primariaId
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică dacă utilizatorul nu încearcă să se șteargă pe sine
    if (id === userId) {
      return NextResponse.json(
        { error: 'Nu poți să îți ștergi propriul cont' },
        { status: 400 }
      )
    }

    // Dezactivează utilizatorul
    await prisma.utilizator.update({
      where: { id: id },
      data: { activ: false }
    })

    // Dezactivează și asocierile cu departamentele
    await prisma.utilizatorDepartament.updateMany({
      where: {
        utilizatorId: id,
        activ: true
      },
      data: { activ: false }
    })

    // Log audit pentru ștergerea utilizatorului
    await createAuditLogFromRequest(request, {
      action: AUDIT_ACTIONS.DELETE_USER,
      userId: userId,
      entityType: 'USER',
      entityId: id,
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
        entityId: id || 'unknown',
        details: {
          success: false,
          error: error.message
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
