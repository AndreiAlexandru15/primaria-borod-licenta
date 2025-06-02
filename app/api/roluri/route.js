/**
 * API Route pentru gestionarea rolurilor
 * @fileoverview CRUD operations pentru roluri în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

/**
 * GET /api/roluri
 * Obține toate rolurile
 */
export async function GET(request) {
  try {
    // const headersList = await headers()
    // const userId = headersList.get('x-user-id')
    // const primariaId = headersList.get('x-primaria-id')

    // Obține rolurile (fără filtrul primariaId)
    const roluri = await prisma.rol.findMany({
      where: {
        activ: true
      },
      select: {
        id: true,
        nume: true,
        descriere: true,
        nivelAcces: true,
        sistem: true,
        createdAt: true,
        updatedAt: true,
        permisiuni: {
          select: {
            permisiune: {
              select: {
                id: true,
                nume: true,
                descriere: true,
                modul: true,
                actiune: true
              }
            }
          }
        },
        utilizatori: {
          where: { activ: true },
          select: { id: true }
        }
      },
      orderBy: { nivelAcces: 'desc' }
    })

    // Transformare pentru frontend
    const data = roluri.map(rol => ({
      id: rol.id,
      nume: rol.nume,
      descriere: rol.descriere,
            nivelAcces: rol.nivelAcces,
      sistem: rol.sistem,
      createdAt: rol.createdAt,
      updatedAt: rol.updatedAt,
      permisiuni: rol.permisiuni.map(p => p.permisiune),
      utilizatoriCount: rol.utilizatori.length
    }))

    return NextResponse.json({ success: true, data: serializeBigInt(data) })
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

/**
 * POST /api/roluri
 * Creează un rol nou cu permisiunile selectate
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { nume, descriere, nivelAcces, sistem, permisiuni = [] } = body

    // Validări
    if (!nume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Numele rolului este obligatoriu' 
      }, { status: 400 })
    }

    if (!nivelAcces || nivelAcces < 1 || nivelAcces > 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nivelul de acces trebuie să fie între 1 și 10' 
      }, { status: 400 })
    }

    // Verifică dacă există deja un rol cu același nume
    const existingRole = await prisma.rol.findFirst({
      where: {
        nume: nume.trim(),
        activ: true
      }
    })

    if (existingRole) {
      return NextResponse.json({ 
        success: false, 
        error: 'Există deja un rol cu acest nume' 
      }, { status: 400 })
    }

    // Creează rolul nou cu permisiunile în tranzacție
    const newRole = await prisma.$transaction(async (tx) => {
      // Creează rolul
      const rol = await tx.rol.create({
        data: {
          nume: nume.trim(),
          descriere: descriere?.trim() || '',
          nivelAcces: parseInt(nivelAcces),
          sistem: Boolean(sistem),
          activ: true
        }
      })

      // Adaugă permisiunile dacă sunt specificate
      if (permisiuni.length > 0) {
        // Verifică că toate permisiunile există
        const existingPermissions = await tx.permisiune.findMany({
          where: {
            id: { in: permisiuni }
          }
        })

        if (existingPermissions.length !== permisiuni.length) {
          throw new Error('Unele permisiuni nu există în sistem')
        }

        // Creează relațiile rol-permisiune
        const rolPermisiuneData = permisiuni.map(permisiuneId => ({
          rolId: rol.id,
          permisiuneId: permisiuneId
        }))

        await tx.rolPermisiune.createMany({
          data: rolPermisiuneData
        })
      }

      // Returnează rolul cu permisiunile
      return await tx.rol.findUnique({
        where: { id: rol.id },
        include: {
          permisiuni: {
            include: {
              permisiune: {
                select: {
                  id: true,
                  nume: true,
                  descriere: true,
                  modul: true,
                  actiune: true
                }
              }
            }
          }
        }
      })
    })

    return NextResponse.json({ 
      success: true, 
      data: serializeBigInt(newRole),
      message: 'Rolul a fost creat cu succes'
    }, { status: 201 })

  } catch (e) {
    console.error('Eroare la crearea rolului:', e)
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Eroare internă la crearea rolului' 
    }, { status: 500 })
  }
}
