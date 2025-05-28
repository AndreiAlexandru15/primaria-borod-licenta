/**
 * API Route pentru gestionarea departamentelor
 * @fileoverview CRUD operations pentru departamente în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

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
        _count: {
          select: {
            registre: true,
            documente: true
          }
        }
      },
      orderBy: {
        nume: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: departamente
    })

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
    console.log('🔍 DEBUG - Primaria ID:', primariaId)

    // Verifică permisiunile - utilizatorul trebuie să aibă permisiunea de creare utilizatori/departamente
    // Permisiunile sunt un array de string-uri, nu obiecte
    const hasPermission = permisiuni.includes('utilizatori_creare') || 
                         permisiuni.includes('sistem_configurare')

    console.log('🔍 DEBUG - Has Permission:', hasPermission)
    console.log('🔍 DEBUG - Permisiuni:', permisiuni)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiunea să creezi departamente' },
        { status: 403 }
      )
    }

    const { nume, descriere } = await request.json()

    // Validare input
    if (!nume || nume.trim().length < 2) {
      return NextResponse.json(
        { error: 'Numele departamentului este obligatoriu (min. 2 caractere)' },
        { status: 400 }
      )
    }

    // Verifică dacă departamentul cu același nume există deja
    const departamentExistent = await prisma.departament.findFirst({
      where: {
        nume: nume.trim(),
        primariaId: primariaId
      }
    })

    if (departamentExistent) {
      return NextResponse.json(
        { error: 'Un departament cu acest nume există deja' },
        { status: 400 }
      )
    }    // Creează departamentul
    const departamentNou = await prisma.departament.create({
      data: {
        nume: nume.trim(),
        cod: nume.trim().toUpperCase().replace(/\s+/g, '_'), // Generează cod automat
        descriere: descriere?.trim() || null,
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

    // Log audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'DEPARTAMENT_CREAT',
        detalii: {
          departamentId: departamentNou.id,
          nume: departamentNou.nume
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Departament creat cu succes',
      data: departamentNou
    }, { status: 201 })

  } catch (error) {
    console.error('Eroare la crearea departamentului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
