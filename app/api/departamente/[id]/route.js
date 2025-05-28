/**
 * API Route pentru operațiuni individuale pe departamente
 * @fileoverview GET, PUT, DELETE pentru departamente specifice
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

/**
 * GET /api/departamente/[id]
 * Obține un departament specific
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

    const { id } = params    
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
            documente: true
          }
        }
      }
    })

    if (!departament) {
      return NextResponse.json(
        { error: 'Departamentul nu a fost găsit' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: departament
    })

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

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }    // Verifică permisiunile
    const hasPermission = permisiuni.includes('utilizatori_editare') || 
                         permisiuni.includes('sistem_configurare')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiunea să editezi departamente' },
        { status: 403 }
      )
    }    const { id } = params
    const { nume, descriere } = await request.json()

    // Verifică dacă departamentul există
    const departamentExistent = await prisma.departament.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      }
    })

    if (!departamentExistent) {
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

    // Verifică dacă alt departament cu același nume există
    const duplicat = await prisma.departament.findFirst({
      where: {
        nume: nume.trim(),
        primariaId: primariaId,
        id: { not: id }
      }
    })

    if (duplicat) {
      return NextResponse.json(
        { error: 'Un alt departament cu acest nume există deja' },
        { status: 400 }
      )
    }    // Actualizează departamentul
    const departamentActualizat = await prisma.departament.update({
      where: { id: id },
      data: {
        nume: nume.trim(),
        cod: nume.trim().toUpperCase().replace(/\s+/g, '_'), // Actualizează și codul
        descriere: descriere?.trim() || null
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
            documente: true
          }
        }
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'DEPARTAMENT_ACTUALIZAT',        detalii: {
          departamentId: id,
          nume: departamentActualizat.nume,
          modificari: { nume, descriere }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Departament actualizat cu succes',
      data: departamentActualizat
    })

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
        { status: 401 }
      )
    }    // Verifică permisiunile
    const hasPermission = permisiuni.includes('utilizatori_stergere') || 
                         permisiuni.includes('sistem_configurare')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiunea să ștergi departamente' },
        { status: 403 }
      )
    }

    const { id } = params    // Verifică dacă departamentul există
    const departament = await prisma.departament.findFirst({
      where: {
        id: id,
        primariaId: primariaId
      },
      include: {
        _count: {
          select: {
            registre: true,
            documente: true
          }
        }
      }
    })

    if (!departament) {
      return NextResponse.json(
        { error: 'Departamentul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică dacă departamentul are registre sau documente asociate
    if (departament._count.registre > 0) {
      return NextResponse.json(
        { error: `Nu poți șterge departamentul. Are ${departament._count.registre} registre asociate.` },
        { status: 400 }
      )
    }

    if (departament._count.documente > 0) {
      return NextResponse.json(
        { error: `Nu poți șterge departamentul. Are ${departament._count.documente} documente asociate.` },
        { status: 400 }
      )
    }

    // Șterge departamentul
    await prisma.departament.delete({
      where: { id: id }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'DEPARTAMENT_STERS',
        detalii: {
          departamentId: id,
          nume: departament.nume
        }
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
