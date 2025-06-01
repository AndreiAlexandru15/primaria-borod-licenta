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
 * Obține toate rolurile pentru primăria curentă
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
    }

    // Obține rolurile pentru primăria curentă
    const roluri = await prisma.rol.findMany({
      where: {
        primariaId: primariaId,
        activ: true
      },
      select: {
        id: true,
        nume: true,
        descriere: true,
        nivel: true,
        activ: true,
        _count: {
          select: {
            utilizatori: {
              where: {
                activ: true
              }
            }
          }
        }
      },
      orderBy: [
        { nivel: 'asc' },
        { nume: 'asc' }
      ]
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: roluri
    }))

  } catch (error) {
    console.error('Eroare la obținerea rolurilor:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
