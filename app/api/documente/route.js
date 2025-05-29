/**
 * API Route pentru operațiuni pe documente/înregistrări
 * @fileoverview GET (lista) și POST (creare) pentru documente
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

/**
 * GET /api/documente
 * Obține lista documentelor cu filtrare
 * Parametri:
 * - registruId: pentru documente înregistrate într-un registru specific
 * - neinregistrate: pentru documente care nu sunt înregistrate în niciun registru
 * - toate: pentru toate documentele (dashboard)
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
      primariaId: primariaId
    }

    if (registruId) {
      // Doar documentele înregistrate în registrul specific
      whereClause.registruId = registruId
    } else if (neinregistrate) {
      // Doar documentele care nu sunt înregistrate în niciun registru
      whereClause.registruId = null
    } else if (toate) {
      // Toate documentele - fără filtru adițional
    } else {
      return NextResponse.json(
        { error: 'Trebuie specificat unul din parametrii: registruId, neinregistrate sau toate' },
        { status: 400 }
      )
    }

    // Obține documentele cu paginare
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [documente, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          departament: {
            select: {
              id: true,
              nume: true,
              cod: true
            }
          },
          registru: {
            select: {
              id: true,
              nume: true,
              cod: true
            }
          },
          categorie: {
            select: {
              id: true,
              nume: true
            }
          },
          _count: {
            select: {
              fisiere: true
            }
          }
        },
        orderBy: [
          // Prioritizează documentele neinregistrate când se cer toate
          ...(toate ? [{ registruId: 'asc' }] : []),
          { dataInregistrare: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.document.count({
        where: whereClause
      })
    ])

    return NextResponse.json({
      success: true,
      data: documente,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

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
 * Creează un document nou (înregistrat sau neinregistrat)
 */
export async function POST(request) {
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

    const data = await request.json()
    
    // Validare câmpuri obligatorii
    const requiredFields = ['subiect', 'tipDocument']
    const missingFields = requiredFields.filter(field => !data[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Câmpurile următoare sunt obligatorii: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    let documentData = {
      primariaId,
      subiect: data.subiect,
      tipDocument: data.tipDocument,
      expeditor: data.expeditor,
      destinatar: data.destinatar,
      confidentialitate: data.confidentialitate || 'public',
      prioritate: data.prioritate || 'normala',
      observatii: data.observatii,
      metadate: data.metadate || {}
    }

    // Dacă registruId este specificat, înregistrează documentul
    if (data.registruId) {
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
      const ultimulDocument = await prisma.document.findFirst({
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
      if (ultimulDocument) {
        const ultimulNumar = parseInt(ultimulDocument.numarInregistrare.split('/')[0])
        numarInregistrare = `${ultimulNumar + 1}/${registru.cod || 'REG'}/${anul}`
      } else {
        numarInregistrare = `1/${registru.cod || 'REG'}/${anul}`
      }

      // Adaugă datele pentru document înregistrat
      documentData = {
        ...documentData,
        registruId: data.registruId,
        departamentId: registru.departamentId,
        numarInregistrare,
        dataInregistrare,
        status: 'inregistrat'
      }
    } else {
      // Document neinregistrat - nu are registru, departament, număr de înregistrare
      documentData = {
        ...documentData,
        dataInregistrare: data.dataInregistrare ? new Date(data.dataInregistrare) : new Date(),
        status: data.status || 'inregistrat' // poate fi alt status pentru documente neinregistrate
      }
    }

    // Creează documentul
    const documentNou = await prisma.document.create({
      data: documentData,
      include: {
        departament: data.registruId ? {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        } : false,
        registru: data.registruId ? {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        } : false
      }
    })

    return NextResponse.json({
      success: true,
      data: documentNou,
      message: data.registruId ? 'Document înregistrat cu succes' : 'Document creat cu succes'
    })

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
