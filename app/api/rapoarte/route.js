import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

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

    const { searchParams } = new URL(request.url)
    const tip = searchParams.get('tip')
    const dataStart = searchParams.get('dataStart')
    const dataEnd = searchParams.get('dataEnd')
    const departamentId = searchParams.get('departamentId')
    const registruId = searchParams.get('registruId')

    if (!tip) {
      return NextResponse.json(
        { error: 'Tipul raportului este obligatoriu' },
        { status: 400 }
      )
    }

    let data = []

    switch (tip) {
      case 'inregistrari-perioada':
        data = await generateInregistrariPerioadaReport(
          primariaId, dataStart, dataEnd, departamentId, registruId
        )
        break

      case 'statistici-departament':
        data = await generateStatisticiDepartamentReport(
          primariaId, dataStart, dataEnd, departamentId, registruId
        )
        break      
        case 'documente-categorie':
        data = await generateDocumenteCategorieReport(
          primariaId, dataStart, dataEnd, departamentId, registruId
        )
        break

      case 'activitate-utilizatori':
        data = await generateActivitateUtilizatoriReport(
          primariaId, dataStart, dataEnd, departamentId, registruId
        )
        break

      case 'raport-anual':
        data = await generateRaportAnualReport(
          primariaId, dataStart, dataEnd, departamentId, registruId
        )
        break

      default:
        return NextResponse.json(
          { error: 'Tip raport nevalid' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt(data),
      tip: tip,
      perioada: {
        start: dataStart,
        end: dataEnd
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Eroare la generarea raportului' },
      { status: 500 }
    )
  }
}

// Raport înregistrări pe perioadă
async function generateInregistrariPerioadaReport(primariaId, dataStart, dataEnd, departamentId, registruId) {
  const whereClause = {
    registru: {
      departament: {
        primariaId: primariaId
      }
    }
  }
  
  if (dataStart && dataEnd) {
    whereClause.dataInregistrare = {
      gte: new Date(dataStart),
      lte: new Date(dataEnd)
    }
  }

  if (registruId) {
    whereClause.registruId = registruId
  } else if (departamentId) {
    whereClause.registru.departament.id = departamentId
  }

  const inregistrari = await prisma.inregistrare.findMany({
    where: whereClause,
    include: {
      registru: {
        include: {
          departament: true
        }
      },
      tipDocument: true
    },
    orderBy: {
      dataInregistrare: 'desc'
    }
  })

  return inregistrari.map(inreg => ({
    id: inreg.id,
    numarInregistrare: inreg.numarInregistrare,
    dataInregistrare: inreg.dataInregistrare,
    expeditor: inreg.expeditor,
    obiect: inreg.obiect,
    status: inreg.status,
    departament: inreg.registru.departament.nume,
    registru: inreg.registru.nume,
    tipDocument: inreg.tipDocument?.nume || 'N/A'
  }))
}

// Raport statistici departament
async function generateStatisticiDepartamentReport(primariaId, dataStart, dataEnd, departamentId, registruId) {
  const dateFilter = {}
  if (dataStart && dataEnd) {
    dateFilter.dataInregistrare = {
      gte: new Date(dataStart),
      lte: new Date(dataEnd)
    }
  }

  const whereClause = {
    primariaId: primariaId
  }

  if (departamentId) {
    whereClause.id = departamentId
  }
  const departamente = await prisma.departament.findMany({
    where: whereClause,
    include: {
      registre: {
        include: {
          inregistrari: {
            where: dateFilter,
            include: {
              fisiere: true
            }
          },
          _count: {
            select: {
              inregistrari: true,
              tipuriDocument: true
            }
          }
        }
      }
    }
  })

  const statistici = {
    totalInregistrari: 0,
    totalDocumente: 0,
    utilizatoriActivi: 0
  }

  const detalii = []
  for (const departament of departamente) {
    for (const registru of departament.registre) {
      const inregistrariInPeriod = registru.inregistrari.length
      // Count all files from inregistrari in the period
      const totalDocumente = registru.inregistrari.reduce((total, inreg) => {
        return total + (inreg.fisiere ? inreg.fisiere.length : 0)
      }, 0)
      
      statistici.totalInregistrari += inregistrariInPeriod
      statistici.totalDocumente += totalDocumente

      // Găsim ultima activitate din registru
      const ultimaActivitate = registru.inregistrari.length > 0 
        ? Math.max(...registru.inregistrari.map(i => new Date(i.dataInregistrare)))
        : null

      detalii.push({
        numeRegistru: registru.nume,
        numarInregistrari: inregistrariInPeriod,
        numarDocumente: totalDocumente,
        ultimaActivitate: ultimaActivitate ? new Date(ultimaActivitate) : null
      })
    }
  }

  // Calculăm utilizatorii activi
  const utilizatoriActivi = await prisma.utilizator.count({
    where: {
      primariaId: primariaId,
      activ: true
    }
  })
  
  statistici.utilizatoriActivi = utilizatoriActivi
  return {
    statistici,
    detalii
  }
}


// Raport documente pe categorii
async function generateDocumenteCategorieReport(primariaId, dataStart, dataEnd, departamentId, registruId) {
  const whereClause = {
    inregistrare: {
      registru: {
        departament: {
          primariaId: primariaId
        }
      }
    }
  }  
  if (dataStart && dataEnd) {
    whereClause.createdAt = {
      gte: new Date(dataStart),
      lte: new Date(dataEnd)
    }
  }

  if (registruId) {
    whereClause.inregistrare.registruId = registruId
  } else if (departamentId) {
    whereClause.inregistrare.registru.departament.id = departamentId
  }

  const documentsWithCategories = await prisma.fisier.findMany({
    where: whereClause,
    include: {
      categorie: true,
      inregistrare: {
        include: {
          registru: {
            include: {
              departament: true
            }
          }
        }
      }
    }
  })

  // Grupează pe categorii
  const categoriesMap = new Map()
  
  documentsWithCategories.forEach(doc => {
    const categorieNume = doc.categorie?.nume || 'Fără categorie'
    
    if (!categoriesMap.has(categorieNume)) {
      categoriesMap.set(categorieNume, {
        categorie: categorieNume,
        numarDocumente: 0,
        dimensiuneTotala: 0,
        departamente: new Set()
      })
    }
    
    const stats = categoriesMap.get(categorieNume)
    stats.numarDocumente++
    stats.dimensiuneTotala += Number(doc.marime || 0)
    if (doc.inregistrare?.registru?.departament?.nume) {
      stats.departamente.add(doc.inregistrare.registru.departament.nume)
    }
  })

  return Array.from(categoriesMap.values()).map(stats => ({
    ...stats,
    departamente: Array.from(stats.departamente),
    dimensiuneTotalaMB: Math.round(stats.dimensiuneTotala / (1024 * 1024) * 100) / 100
  }))
}

// Raport activitate utilizatori
async function generateActivitateUtilizatoriReport(primariaId, dataStart, dataEnd, departamentId, registruId) {
  const whereClause = {
    utilizator: {
      primariaId: primariaId
    }
  }
  
  if (dataStart && dataEnd) {
    whereClause.createdAt = {
      gte: new Date(dataStart),
      lte: new Date(dataEnd)
    }
  }

  const activitati = await prisma.auditLog.findMany({
    where: whereClause,
    include: {
      utilizator: {
        include: {
          departamente: {
            include: {
              departament: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Grupează pe utilizatori
  const utilizatoriMap = new Map()
  
  activitati.forEach(activitate => {
    if (!activitate.utilizator) return
    
    const utilizatorId = activitate.utilizator.id
    
    if (!utilizatoriMap.has(utilizatorId)) {
      utilizatoriMap.set(utilizatorId, {
        nume: `${activitate.utilizator.nume} ${activitate.utilizator.prenume}`,
        email: activitate.utilizator.email,
        functie: activitate.utilizator.functie,
        numarActivitati: 0,
        ultimaActivitate: activitate.createdAt,
        actiuni: new Map()
      })
    }
    
    const user = utilizatoriMap.get(utilizatorId)
    user.numarActivitati++
    
    if (activitate.createdAt > user.ultimaActivitate) {
      user.ultimaActivitate = activitate.createdAt
    }
    
    // Contorizează tipurile de acțiuni
    if (!user.actiuni.has(activitate.actiune)) {
      user.actiuni.set(activitate.actiune, 0)
    }
    user.actiuni.set(activitate.actiune, user.actiuni.get(activitate.actiune) + 1)
  })

  return Array.from(utilizatoriMap.values()).map(user => ({
    ...user,
    actiuni: Object.fromEntries(user.actiuni)
  }))
}

// Raport anual complet
async function generateRaportAnualReport(primariaId, dataStart, dataEnd, departamentId, registruId) {
  const anul = dataStart ? new Date(dataStart).getFullYear() : new Date().getFullYear()
  
  // Statistici generale pentru an
  const startOfYear = new Date(anul, 0, 1)
  const endOfYear = new Date(anul, 11, 31)
    const [
    totalInregistrari,
    totalDocumente,
    totalDepartamente,
    totalRegistre
  ] = await Promise.all([
    prisma.inregistrare.count({
      where: {
        dataInregistrare: { gte: startOfYear, lte: endOfYear },
        registru: {
          departament: {
            primariaId: primariaId,
            ...(departamentId && { id: departamentId })
          }
        },
        ...(registruId && { registruId })
      }
    }),
    prisma.fisier.count({
      where: {
        createdAt: { gte: startOfYear, lte: endOfYear },
        inregistrare: {
          registru: {
            departament: {
              primariaId: primariaId,
              ...(departamentId && { id: departamentId })
            }
          },
          ...(registruId && { registruId })
        }
      }
    }),
    prisma.departament.count({
      where: {
        primariaId: primariaId,
        activ: true,
        ...(departamentId && { id: departamentId })
      }
    }),
    prisma.registru.count({
      where: {
        departament: {
          primariaId: primariaId,
          ...(departamentId && { id: departamentId })
        },
        activ: true,
        an: anul,
        ...(registruId && { id: registruId })
      }
    })
  ])

  // Evoluție pe luni
  const evolutieLunara = []
  for (let luna = 0; luna < 12; luna++) {
    const startLuna = new Date(anul, luna, 1)
    const endLuna = new Date(anul, luna + 1, 0)
      const inregistrariLuna = await prisma.inregistrare.count({
      where: {
        dataInregistrare: { gte: startLuna, lte: endLuna },
        registru: {
          departament: {
            primariaId: primariaId,
            ...(departamentId && { id: departamentId })
          }
        },
        ...(registruId && { registruId })
      }
    })
    
    evolutieLunara.push({
      luna: luna + 1,
      numeLuna: startLuna.toLocaleDateString('ro-RO', { month: 'long' }),
      inregistrari: inregistrariLuna
    })
  }

  return {
    rezumat: {
      anul,
      totalInregistrari,
      totalDocumente,
      totalDepartamente,
      totalRegistre
    },
    evolutieLunara
  }
}
