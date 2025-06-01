/**
 * API Route pentru gestionarea permisiunilor
 * @fileoverview CRUD operations pentru permisiuni în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

/**
 * GET /api/permisiuni
 * Obține toate permisiunile
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const modul = searchParams.get('modul')

    const whereClause = modul ? { modul } : {}

    const permisiuni = await prisma.permisiune.findMany({
      where: whereClause,
      select: {
        id: true,
        nume: true,
        descriere: true,
        modul: true,
        actiune: true,
        createdAt: true,
        roluri: {
          select: {
            rol: {
              select: {
                id: true,
                nume: true
              }
            }
          }
        }
      },
      orderBy: [
        { modul: 'asc' },
        { actiune: 'asc' },
        { nume: 'asc' }
      ]
    })

    // Transformare pentru frontend
    const data = permisiuni.map(permisiune => ({
      id: permisiune.id,
      nume: permisiune.nume,
      descriere: permisiune.descriere,
      modul: permisiune.modul,
      actiune: permisiune.actiune,
      createdAt: permisiune.createdAt,
      roluri: permisiune.roluri.map(r => r.rol),
      roluriCount: permisiune.roluri.length
    }))

    return NextResponse.json({ success: true, data: serializeBigInt(data) })
  } catch (e) {
    console.error('Eroare la obținerea permisiunilor:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

/**
 * POST /api/permisiuni
 * Creează o permisiune nouă
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { nume, descriere, modul, actiune } = body

    // Validări
    if (!nume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Numele permisiunii este obligatoriu' 
      }, { status: 400 })
    }

    if (!modul) {
      return NextResponse.json({ 
        success: false, 
        error: 'Modulul este obligatoriu' 
      }, { status: 400 })
    }

    if (!actiune) {
      return NextResponse.json({ 
        success: false, 
        error: 'Acțiunea este obligatorie' 
      }, { status: 400 })
    }

    // Verifică dacă există deja o permisiune cu același nume
    const existingPermission = await prisma.permisiune.findFirst({
      where: {
        nume: nume.trim()
      }
    })

    if (existingPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Există deja o permisiune cu acest nume' 
      }, { status: 400 })
    }

    // Creează permisiunea nouă
    const newPermission = await prisma.permisiune.create({
      data: {
        nume: nume.trim(),
        descriere: descriere?.trim() || '',
        modul: modul.trim(),
        actiune: actiune.trim()
      },
      select: {
        id: true,
        nume: true,
        descriere: true,
        modul: true,
        actiune: true,
        createdAt: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: serializeBigInt(newPermission),
      message: 'Permisiunea a fost creată cu succes'
    }, { status: 201 })

  } catch (e) {
    console.error('Eroare la crearea permisiunii:', e)
    return NextResponse.json({ 
      success: false, 
      error: 'Eroare internă la crearea permisiunii' 
    }, { status: 500 })
  }
}

/**
 * PUT /api/permisiuni
 * Actualizează o permisiune existentă
 */
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, nume, descriere, modul, actiune } = body

    // Validări
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID-ul permisiunii este obligatoriu' 
      }, { status: 400 })
    }

    if (!nume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Numele permisiunii este obligatoriu' 
      }, { status: 400 })
    }

    if (!modul) {
      return NextResponse.json({ 
        success: false, 
        error: 'Modulul este obligatoriu' 
      }, { status: 400 })
    }

    if (!actiune) {
      return NextResponse.json({ 
        success: false, 
        error: 'Acțiunea este obligatorie' 
      }, { status: 400 })
    }

    // Verifică dacă permisiunea există
    const existingPermission = await prisma.permisiune.findUnique({
      where: { id }
    })

    if (!existingPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Permisiunea nu a fost găsită' 
      }, { status: 404 })
    }

    // Verifică dacă există altă permisiune cu același nume
    const duplicatePermission = await prisma.permisiune.findFirst({
      where: {
        nume: nume.trim(),
        NOT: { id }
      }
    })

    if (duplicatePermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Există deja o permisiune cu acest nume' 
      }, { status: 400 })
    }

    // Actualizează permisiunea
    const updatedPermission = await prisma.permisiune.update({
      where: { id },
      data: {
        nume: nume.trim(),
        descriere: descriere?.trim() || '',
        modul: modul.trim(),
        actiune: actiune.trim()
      },
      select: {
        id: true,
        nume: true,
        descriere: true,
        modul: true,
        actiune: true,
        createdAt: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: serializeBigInt(updatedPermission),
      message: 'Permisiunea a fost actualizată cu succes'
    })

  } catch (e) {
    console.error('Eroare la actualizarea permisiunii:', e)
    return NextResponse.json({ 
      success: false, 
      error: 'Eroare internă la actualizarea permisiunii' 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/permisiuni
 * Șterge o permisiune
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID-ul permisiunii este obligatoriu' 
      }, { status: 400 })
    }

    // Verifică dacă permisiunea există
    const existingPermission = await prisma.permisiune.findUnique({
      where: { id },
      include: {
        roluri: true
      }
    })

    if (!existingPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Permisiunea nu a fost găsită' 
      }, { status: 404 })
    }

    // Verifică dacă permisiunea este folosită de roluri
    if (existingPermission.roluri.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nu se poate șterge permisiunea deoarece este folosită de roluri' 
      }, { status: 400 })
    }

    // Șterge permisiunea
    await prisma.permisiune.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Permisiunea a fost ștearsă cu succes'
    })

  } catch (e) {
    console.error('Eroare la ștergerea permisiunii:', e)
    return NextResponse.json({ 
      success: false, 
      error: 'Eroare internă la ștergerea permisiunii' 
    }, { status: 500 })
  }
}
