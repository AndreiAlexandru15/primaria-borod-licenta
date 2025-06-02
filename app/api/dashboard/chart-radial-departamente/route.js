import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

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

    // Calculează perioada curentă și anterioară
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Query optimizat cu groupBy
    const [inregistrariThisMonth, inregistrariLastMonth] = await Promise.all([
      // Înregistrări luna curentă grupate pe departament
      prisma.inregistrare.groupBy({
        by: ['registruId'],
        where: {
          registru: {
            departament: {
              primariaId: primariaId,
              activ: true
            }
          },
          createdAt: {
            gte: startOfMonth
          }
        },
        _count: {
          id: true
        }
      }),
      // Înregistrări luna trecută
      prisma.inregistrare.count({
        where: {
          registru: {
            departament: {
              primariaId: primariaId,
              activ: true
            }
          },
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ])

    // Obține informațiile despre registre și departamente
    const registruIds = inregistrariThisMonth.map(item => item.registruId)
    const registre = await prisma.registru.findMany({
      where: {
        id: { in: registruIds }
      },
      select: {
        id: true,
        departament: {
          select: {
            id: true,
            nume: true
          }
        }
      }
    })

    // Grupează pe departamente
    const departamenteMap = new Map()
    
    inregistrariThisMonth.forEach(item => {
      const registru = registre.find(r => r.id === item.registruId)
      if (registru) {
        const deptId = registru.departament.id
        const deptNume = registru.departament.nume
        
        const existing = departamenteMap.get(deptId) || {
          nume: deptNume,
          total: 0
        }
        
        existing.total += item._count.id
        departamenteMap.set(deptId, existing)
      }
    })

    // Convertește în format pentru chart
    const chartData = Array.from(departamenteMap.values())
      .map((dept, index) => ({
        departament: dept.nume,
        inregistrari: dept.total,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`
      }))
      .sort((a, b) => b.inregistrari - a.inregistrari)

    // Calculează tendința
    const totalThisMonth = chartData.reduce((sum, item) => sum + item.inregistrari, 0)
    const tendinta = inregistrariLastMonth > 0 
      ? ((totalThisMonth - inregistrariLastMonth) / inregistrariLastMonth) * 100 
      : totalThisMonth > 0 ? 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        departamente: chartData,
        tendinta: tendinta,
        totalThisMonth: totalThisMonth,
        totalLastMonth: inregistrariLastMonth,
        statistici: {
          departamentCelMaiActiv: chartData[0] || null,
          mediePeDepartament: chartData.length > 0 ? Math.round(totalThisMonth / chartData.length) : 0,
          numarDepartamenteActive: chartData.length
        }
      }
    })

  } catch (error) {
    console.error('Eroare la chart radial departamente:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}