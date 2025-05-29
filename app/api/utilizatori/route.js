/**
 * API Route pentru gestionarea utilizatorilor
 * @fileoverview CRUD operations pentru utilizatori în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

/**
 * GET /api/utilizatori
 * Obține toți utilizatorii pentru primăria curentă
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
    }    // Obține utilizatorii pentru primăria curentă
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

    return NextResponse.json({
      success: true,
      data: utilizatori
    })

  } catch (error) {
    console.error('Eroare la obținerea utilizatorilor:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
