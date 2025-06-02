import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/dashboard/stats
 * Obține statisticile pentru dashboard
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

    // Calculează datele pentru perioada curentă și anterioară
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Statistici înregistrări
    const [inregistrariTotal, inregistrariThisMonth, inregistrariLastMonth] = await Promise.all([
      // Total înregistrări
      prisma.inregistrare.count({
        where: {
          registru: {
            departament: {
              primariaId: primariaId
            }
          }
        }
      }),
      // Înregistrări luna aceasta
      prisma.inregistrare.count({
        where: {
          registru: {
            departament: {
              primariaId: primariaId
            }
          },
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      // Înregistrări luna trecută
      prisma.inregistrare.count({
        where: {
          registru: {
            departament: {
              primariaId: primariaId
            }
          },
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ])

    // Statistici utilizatori
    const [utilizatoriTotal, utilizatoriActive] = await Promise.all([
      // Total utilizatori
      prisma.utilizator.count({
        where: {
          primariaId: primariaId
        }
      }),
      // Utilizatori activi (conectați în ultimele 30 zile)
      prisma.utilizator.count({
        where: {
          primariaId: primariaId,
          activ: true,
          ultimaLogare: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 zile
          }
        }
      })
    ])

    // Statistici documente
    const [documenteTotal, documenteThisMonth, documenteLastMonth, documentePending] = await Promise.all([
      // Total documente
      prisma.fisier.count({
        where: {
          inregistrare: {
            registru: {
              departament: {
                primariaId: primariaId
              }
            }
          }
        }
      }),
      // Documente luna aceasta
      prisma.fisier.count({
        where: {
          inregistrare: {
            registru: {
              departament: {
                primariaId: primariaId
              }
            }
          },
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      // Documente luna trecută
      prisma.fisier.count({
        where: {
          inregistrare: {
            registru: {
              departament: {
                primariaId: primariaId
              }
            }
          },
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      // Documente în așteptare (fără înregistrare)
      prisma.fisier.count({
        where: {
          inregistrareId: null,
          // Opțional: poți adăuga filtrare pe primărie
        }
      })
    ])

    // Statistici registre și departamente
    const [registreActive, departamenteTotal] = await Promise.all([
      // Registre active
      prisma.registru.count({
        where: {
          departament: {
            primariaId: primariaId
          },
          activ: true
        }
      }),
      // Total departamente
      prisma.departament.count({
        where: {
          primariaId: primariaId,
          activ: true
        }
      })
    ])

    const stats = {
      inregistrari: {
        total: inregistrariTotal,
        thisMonth: inregistrariThisMonth,
        lastMonth: inregistrariLastMonth
      },
      utilizatori: {
        total: utilizatoriTotal,
        active: utilizatoriActive,
        lastMonthTotal: utilizatoriTotal // Pentru simplitate, folosim totalul
      },
      documente: {
        total: documenteTotal,
        thisMonth: documenteThisMonth,
        lastMonth: documenteLastMonth,
        pending: documentePending
      },
      registre: {
        active: registreActive,
        lastMonthActive: registreActive // Pentru simplitate
      },
      departamente: {
        total: departamenteTotal
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Eroare la obținerea statisticilor dashboard:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}