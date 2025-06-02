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

    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '30d'

    // Calculează perioada
    const now = new Date()
    let daysToSubtract = 30
    if (period === '90d') {
      daysToSubtract = 90
    } else if (period === '7d') {
      daysToSubtract = 7
    }

    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    // Query pentru înregistrări grupate pe zi și tip registru
    const inregistrari = await prisma.inregistrare.findMany({
      where: {
        registru: {
          departament: {
            primariaId: primariaId
          }
        },
        dataInregistrare: {
          gte: startDate
        }
      },
      include: {
        registru: {
          select: {
            tipRegistru: true
          }
        }
      },
      orderBy: {
        dataInregistrare: 'asc'
      }
    })

    // Grupează datele pe zi și tip registru
    const groupedData = {}
    
    inregistrari.forEach((inregistrare) => {
      const dateKey = inregistrare.dataInregistrare.toISOString().split('T')[0]
      const tipRegistru = inregistrare.registru.tipRegistru
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          intrare: 0,
          iesire: 0,
          intern: 0,
          intrare_iesire: 0
        }
      }
      
      groupedData[dateKey][tipRegistru]++
    })

    // Convertește în array și completează zilele lipsă
    const chartData = []
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      chartData.push(groupedData[dateKey] || {
        date: dateKey,
        intrare: 0,
        iesire: 0,
        intern: 0,
        intrare_iesire: 0
      })
    }

    return NextResponse.json({
      success: true,
      data: chartData
    })

  } catch (error) {
    console.error('Eroare la obținerea datelor graficului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}