import { NextResponse } from 'next/server'
import { getAuditStatistics } from '@/lib/audit'

// GET - Retrieve audit statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      userId: searchParams.get('userId')
    }

    // Remove null/undefined values
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key]
    })

    const statistics = await getAuditStatistics(filters)

    return NextResponse.json({
      success: true,
      data: statistics
    })
  } catch (error) {
    console.error('Error fetching audit statistics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit statistics' },
      { status: 500 }
    )
  }
}
