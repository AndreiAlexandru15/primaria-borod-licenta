/**
 * API Route pentru gestionarea departamentelor
 * @fileoverview CRUD operations pentru departamente în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { createAuditLogFromRequest, AUDIT_ACTIONS } from '@/lib/audit'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

/**
 * GET /api/departamente
 * Obține toate departamentele pentru primăria curentă
 */
export async function GET(request) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }    // Obține departamentele pentru primăria curentă
    const departamente = await prisma.departament.findMany({
      where: {
        primariaId: primariaId
      },
      include: {
        responsabil: {
          select: {
            id: true,
            nume: true,
            prenume: true,
            email: true,
            functie: true
          }
        },
        utilizatori: {
          where: {
            activ: true
          },
          include: {
            utilizator: {
              select: {
                id: true,
                nume: true,
                prenume: true,
                email: true,
                functie: true
              }
            }
          }
        },        _count: {
          select: {
            registre: true,
            utilizatori: {
              where: {
                activ: true
              }
            }
          }
        }      },
      orderBy: {
        nume: 'asc'
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: departamente
    }))

  } catch (error) {
    console.error('Eroare la obținerea departamentelor:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/departamente
 * Creează un departament nou
 */
export async function POST(request) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')
    const permisiuni = JSON.parse(headersList.get('x-user-permissions') || '[]')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }    // Debug - să vedem ce permisiuni primim
    console.log('🔍 DEBUG - Permisiuni primite:', permisiuni)
    console.log('🔍 DEBUG - User ID:', userId)
    console.log('🔍 DEBUG - Primaria ID:', primariaId)    // Verifică permisiunile - utilizatorul trebuie să aibă permisiunea de creare utilizatori/departamente
    // Permisiunile sunt un array de string-uri, nu obiecte
    const hasPermission = permisiuni.includes('utilizatori_creare') || 
                         permisiuni.includes('sistem_configurare');

    console.log('🔍 DEBUG - Has Permission:', hasPermission)
    console.log('🔍 DEBUG - Permisiuni:', permisiuni)

    if (!hasPermission) {
      // Log încercare de creare fără permisiuni
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Acces interzis - lipsă permisiuni',
          userPermissions: permisiuni,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Nu ai permisiunea să creezi departamente' },
        { status: 403 }
      )
    }const { nume, cod, descriere, responsabilId, telefon, email } = await request.json()    // Validare input
    if (!nume || nume.trim().length < 2) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Validare eșuată - nume invalid',
          providedName: nume,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Numele departamentului este obligatoriu (min. 2 caractere)' },
        { status: 400 }
      )
    }

    if (!cod || cod.trim().length < 1) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Validare eșuată - cod invalid',
          providedCode: cod,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Codul departamentului este obligatoriu' },
        { status: 400 }
      )
    }

    // Validare email dacă este furnizat
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Validare eșuată - email invalid',
          providedEmail: email,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Adresa de email nu este validă' },
        { status: 400 }
      )
    }

    // Verifică dacă departamentul cu același nume există deja
    const departamentExistentNume = await prisma.departament.findFirst({
      where: {
        nume: nume.trim(),
        primariaId: primariaId      }
    })

    if (departamentExistentNume) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Conflict - nume departament existent',
          attemptedName: nume.trim(),
          existingDepartmentId: departamentExistentNume.id,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Un departament cu acest nume există deja' },
        { status: 400 }
      )
    }

    // Verifică dacă departamentul cu același cod există deja
    const departamentExistentCod = await prisma.departament.findFirst({
      where: {
        cod: cod.trim(),
        primariaId: primariaId
      }
    })

    if (departamentExistentCod) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Conflict - cod departament existent',
          attemptedCode: cod.trim(),
          existingDepartmentId: departamentExistentCod.id,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Un departament cu acest cod există deja' },
        { status: 400 }
      )
    }

    // Verifică dacă responsabilul există (dacă este furnizat)
    if (responsabilId) {
      const responsabil = await prisma.utilizator.findFirst({
        where: {
          id: responsabilId,
          primariaId: primariaId,
          activ: true        }
      })

      if (!responsabil) {
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
          userId: userId,
          success: false,
          details: {
            error: 'Responsabil invalid - utilizator negăsit',
            attemptedResponsibleId: responsabilId,
            primariaId: primariaId
          }
        })
        
        return NextResponse.json(
          { error: 'Responsabilul selectat nu a fost găsit' },
          { status: 400 }
        )      }
    }

    // Creează departamentul
    const departamentNou = await prisma.departament.create({
      data: {
        nume: nume.trim(),
        cod: cod.trim(),
        descriere: descriere?.trim() || null,
        responsabilId: responsabilId || null,
        telefon: telefon?.trim() || null,
        email: email?.trim() || null,
        primariaId: primariaId
      },
      include: {
        responsabil: {
          select: {
            id: true,
            nume: true,
            prenume: true,
            email: true,
            functie: true
          }        },          _count: {
            select: {
              registre: true
            }
          }
      }
    })    // Log audit pentru crearea cu succes a departamentului
    await createAuditLogFromRequest(request, {
      action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
      userId: userId,
      details: {
        departmentId: departamentNou.id,
        departmentName: departamentNou.nume,
        departmentCode: departamentNou.cod,
        responsibleId: departamentNou.responsabilId,
        email: departamentNou.email,
        telephone: departamentNou.telefon,
        description: departamentNou.descriere,
        primariaId: primariaId
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      message: 'Departament creat cu succes',
      data: departamentNou
    }), { status: 201 })

  } catch (error) {
    console.error('Eroare la crearea departamentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
