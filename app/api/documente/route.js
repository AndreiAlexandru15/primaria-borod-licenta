/**
 * API Route pentru operațiuni pe înregistrări
 * @fileoverview GET (lista) și POST (creare) pentru înregistrări
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
 * GET /api/documente
 * Obține lista înregistrărilor cu filtrare
 * Parametri:
 * - registruId: pentru înregistrări dintr-un registru specific
 * - toate: pentru toate înregistrările (dashboard)
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

    const url = new URL(request.url)
    const registruId = url.searchParams.get('registruId')
    const neinregistrate = url.searchParams.get('neinregistrate') === 'true'
    const toate = url.searchParams.get('toate') === 'true'

    // Construiește filtrul pentru query
    let whereClause = {
      registru: {
        departament: {
          primariaId: primariaId
        }
      }
    }

    if (registruId) {
      // Doar înregistrările din registrul specific
      whereClause.registruId = registruId
    } else if (toate) {
      // Toate înregistrările - fără filtru adițional pe registru
    } else {
      return NextResponse.json(
        { error: 'Trebuie specificat unul din parametrii: registruId sau toate' },
        { status: 400 }
      )
    }

    // Obține documentele cu paginare
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [documente, total] = await Promise.all([
      prisma.inregistrare.findMany({
        where: whereClause,
        include: {
          registru: {
            select: {
              id: true,
              nume: true,
              cod: true,
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
              fisiere: true
            }
          }
        },
        orderBy: [
          { dataInregistrare: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.inregistrare.count({
        where: whereClause
      })
    ])    
    
    return NextResponse.json(serializeBigInt({
      success: true,
      data: documente,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }))

  } catch (error) {
    console.error('Eroare la obținerea documentelor:', error)
    return NextResponse.json(
      { error: 'Eroare internă a serverului' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documente
 * Creează o înregistrare nouă
 */
export async function POST(request) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }      )
    }

    const data = await request.json()
    
    // Validare câmpuri obligatorii
    const requiredFields = ['obiect', 'registruId']
    const missingFields = requiredFields.filter(field => !data[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Câmpurile următoare sunt obligatorii: ${missingFields.join(', ')}` },
        { status: 400 }      )
    }

    // Verifică dacă registrul există
    const registru = await prisma.registru.findFirst({
      where: {
        id: data.registruId,
        departament: {
          primariaId: primariaId
        }
      },
      include: {
        departament: true
      }
    })

    if (!registru) {
      return NextResponse.json(
        { error: 'Registrul specificat nu există' },
        { status: 404 }
      )
    }

    // Generează numărul de înregistrare
    const dataInregistrare = data.dataInregistrare ? new Date(data.dataInregistrare) : new Date()
    const anul = dataInregistrare.getFullYear()
    
    // Obține ultimul număr pentru anul curent în acest registru
    const ultimaInregistrare = await prisma.inregistrare.findFirst({
      where: {
        registruId: data.registruId,
        dataInregistrare: {
          gte: new Date(`${anul}-01-01`),
          lt: new Date(`${anul + 1}-01-01`)
        }
      },
      orderBy: {
        numarInregistrare: 'desc'
      }
    })

    let numarInregistrare
    if (ultimaInregistrare) {
      const ultimulNumar = parseInt(ultimaInregistrare.numarInregistrare.split('/')[0])
      numarInregistrare = `${ultimulNumar + 1}/${registru.cod || 'REG'}/${anul}`
    } else {
      numarInregistrare = `1/${registru.cod || 'REG'}/${anul}`
    }

    // Creează înregistrarea
    const inregistrareNoua = await prisma.inregistrare.create({
      data: {
        registruId: data.registruId,
        numarInregistrare,
        dataInregistrare,
        expeditor: data.expeditor,
        destinatar: data.destinatar,
        obiect: data.obiect,
        observatii: data.observatii,
        urgent: data.urgent || false,
        confidential: data.confidential || false,
        status: 'activa'
      },
      include: {
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true,
            departament: {
              select: {
                id: true,
                nume: true,
                cod: true
              }
            }
          }
        }
      }    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: inregistrareNoua,
      message: 'Înregistrare creată cu succes'
    }))

  } catch (error) {
    console.error('Eroare la crearea documentului:', error)
    
    // Eroare de unicitate pentru numărul de înregistrare
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Numărul de înregistrare există deja' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Eroare internă a serverului' },
      { status: 500 }
    )
  }
}
