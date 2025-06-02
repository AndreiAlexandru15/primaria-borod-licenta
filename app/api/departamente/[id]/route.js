/**
 * API Route pentru operațiuni individuale pe departamente
 * @fileoverview GET, PUT, DELETE pentru departamente specifice
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
 * GET /api/departamente/[id]
 * Obține un departament specific
 */
export async function GET(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    const { id } = await params

    const departament = await prisma.departament.findFirst({
      where: {
        id: id,
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
        _count: {
          select: {
            registre: true,
            utilizatori: true
          }
        }
      }
    })

    if (!departament) {
      return NextResponse.json(
        { error: 'Departamentul nu a fost găsit' },
        { status: 404 }
      )    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data: departament
    }))

  } catch (error) {
    console.error('Eroare la obținerea departamentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/departamente/[id]
 * Actualizează un departament
 */
export async function PUT(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')
    const permisiuni = JSON.parse(headersList.get('x-user-permissions') || '[]')

    if (!userId || !primariaId) {      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }    // Verifică permisiunile
    const hasPermission = permisiuni.includes('utilizatori_editare') || 
                         permisiuni.includes('sistem_configurare')

    if (!hasPermission) {
      // Log încercare de editare fără permisiuni
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.UPDATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Acces interzis - lipsă permisiuni',
          departmentId: id,
          userPermissions: permisiuni,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Nu ai permisiunea să editezi departamente' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { nume, cod, descriere, telefon, email, responsabilId } = await request.json()

    // Verifică dacă departamentul există
    const departamentExistent = await prisma.departament.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      },
      include: {
        _count: {
          select: {
            registre: true
          }
        }      }
    })

    if (!departamentExistent) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.UPDATE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Departament negăsit',
          departmentId: id,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Departamentul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Validare input
    if (!nume || nume.trim().length < 2) {
      return NextResponse.json(
        { error: 'Numele departamentului este obligatoriu (min. 2 caractere)' },
        { status: 400 }
      )
    }

    if (!cod || cod.trim().length < 2) {
      return NextResponse.json(
        { error: 'Codul departamentului este obligatoriu (min. 2 caractere)' },
        { status: 400 }
      )
    }

    // Validare email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Adresa de email nu este validă' },
        { status: 400 }
      )
    }

    // Validare telefon
    if (telefon && !/^[\d\s\-\+\(\)\.]+$/.test(telefon)) {
      return NextResponse.json(
        { error: 'Numărul de telefon nu este valid' },
        { status: 400 }
      )
    }

    // Verifică dacă responsabilul există (dacă este specificat)
    if (responsabilId && responsabilId !== 'none') {
      const responsabilExista = await prisma.utilizator.findFirst({
        where: {
          id: responsabilId,
          primariaId: primariaId
        }
      })

      if (!responsabilExista) {
        return NextResponse.json(
          { error: 'Responsabilul specificat nu există' },
          { status: 400 }
        )      }
    }

    // Verifică dacă codul se încearcă să fie modificat și departamentul are registre
    const areRegistre = departamentExistent._count.registre > 0
    const codSeModifica = cod.trim() !== departamentExistent.cod

    if (codSeModifica && areRegistre) {
      return NextResponse.json(
        { 
          error: `Codul departamentului nu poate fi modificat deoarece există ${departamentExistent._count.registre} registre asociate` 
        },
        { status: 400 }
      )
    }

    // Verifică dacă alt departament cu același nume există
    const duplicatNume = await prisma.departament.findFirst({
      where: {
        nume: nume.trim(),
        primariaId: primariaId,
        id: { not: id }
      }
    })

    if (duplicatNume) {
      return NextResponse.json(
        { error: 'Un alt departament cu acest nume există deja' },
        { status: 400 }
      )
    }

    // Verifică dacă alt departament cu același cod există (doar dacă codul se modifică)
    if (codSeModifica) {
      const duplicatCod = await prisma.departament.findFirst({
        where: {
          cod: cod.trim(),
          primariaId: primariaId,
          id: { not: id }
        }
      })

      if (duplicatCod) {
        return NextResponse.json(
          { error: 'Un alt departament cu acest cod există deja' },
          { status: 400 }
        )
      }
    }

    // Pregătește datele pentru actualizare
    const dataUpdate = {
      nume: nume.trim(),
      descriere: descriere?.trim() || null,
      telefon: telefon?.trim() || null,
      email: email?.trim() || null,      responsabilId: responsabilId === 'none' ? null : responsabilId || null
    }

    // Adaugă codul doar dacă se poate modifica
    if (!areRegistre) {
      dataUpdate.cod = cod.trim()
    }

    // Actualizează departamentul
    const departamentActualizat = await prisma.departament.update({
      where: { id: id },
      data: dataUpdate,
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
        _count: {
          select: {
            registre: true,
            utilizatori: true
          }
        }
      }
    })    // Log audit pentru actualizarea cu succes
    await createAuditLogFromRequest(request, {
      action: AUDIT_ACTIONS.UPDATE_DEPARTMENT,
      userId: userId,
      details: {
        departmentId: id,
        oldData: {
          nume: departamentExistent.nume,
          cod: departamentExistent.cod,
          descriere: departamentExistent.descriere,
          responsabilId: departamentExistent.responsabilId,
          telefon: departamentExistent.telefon,
          email: departamentExistent.email
        },
        newData: {
          nume: departamentActualizat.nume,
          cod: departamentActualizat.cod,
          descriere: departamentActualizat.descriere,
          responsabilId: departamentActualizat.responsabilId,
          telefon: departamentActualizat.telefon,
          email: departamentActualizat.email
        },
        changes: dataUpdate,
        primariaId: primariaId
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      message: 'Departament actualizat cu succes',
      data: departamentActualizat
    }))

  } catch (error) {
    console.error('Eroare la actualizarea departamentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/departamente/[id]
 * Șterge un departament
 */
export async function DELETE(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')
    const permisiuni = JSON.parse(headersList.get('x-user-permissions') || '[]')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }      )
    }    // Verifică permisiunile
    const hasPermission = permisiuni.includes('utilizatori_stergere') || 
                         permisiuni.includes('sistem_configurare')

    if (!hasPermission) {
      // Log încercare de ștergere fără permisiuni
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.DELETE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Acces interzis - lipsă permisiuni',
          departmentId: id,
          userPermissions: permisiuni,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Nu ai permisiunea să ștergi departamente' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verifică dacă departamentul există
    const departament = await prisma.departament.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      },
      include: {
        _count: {
          select: {
            registre: true,
            utilizatori: true
          }
        }      }
    })

    if (!departament) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.DELETE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Departament negăsit',
          departmentId: id,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: 'Departamentul nu a fost găsit' },
        { status: 404 }      )
    }    // Verifică dacă departamentul are registre sau utilizatori asociați
    if (departament._count.registre > 0) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.DELETE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Ștergere blocată - departamentul are registre asociate',
          departmentId: id,
          departmentName: departament.nume,
          registersCount: departament._count.registre,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: `Nu poți șterge departamentul. Are ${departament._count.registre} registre asociate.` },
        { status: 400 }
      )
    }

    if (departament._count.utilizatori > 0) {
      await createAuditLogFromRequest(request, {
        action: AUDIT_ACTIONS.DELETE_DEPARTMENT,
        userId: userId,
        success: false,
        details: {
          error: 'Ștergere blocată - departamentul are utilizatori asociați',
          departmentId: id,
          departmentName: departament.nume,
          usersCount: departament._count.utilizatori,
          primariaId: primariaId
        }
      })
      
      return NextResponse.json(
        { error: `Nu poți șterge departamentul. Are ${departament._count.utilizatori} utilizatori asociați.` },
        { status: 400 }
      )
    }    // Șterge departamentul
    await prisma.departament.delete({
      where: { id: id }
    })

    // Log audit pentru ștergerea cu succes
    await createAuditLogFromRequest(request, {
      action: AUDIT_ACTIONS.DELETE_DEPARTMENT,
      userId: userId,
      details: {
        departmentId: id,
        departmentName: departament.nume,
        departmentCode: departament.cod,
        departmentData: {
          nume: departament.nume,
          cod: departament.cod,
          descriere: departament.descriere,
          responsabilId: departament.responsabilId,
          telefon: departament.telefon,
          email: departament.email
        },
        primariaId: primariaId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Departament șters cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea departamentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
