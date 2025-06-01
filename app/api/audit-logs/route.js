import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { headers } from 'next/headers'

const prisma = new PrismaClient()

// GET - Retrieve audit logs with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit    // Filtering parameters
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // Build where clause
    const where = {}
    
    if (action) where.actiune = action
    if (userId) where.utilizatorId = userId
    if (entityType) {
      // Map entityType to the appropriate field
      if (entityType === 'FISIER') {
        where.fisierId = { not: null }
      } else if (entityType === 'INREGISTRARE') {
        where.inregistrareId = { not: null }
      }
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { actiune: { contains: search, mode: 'insensitive' } },
        { detalii: { path: [], string_contains: search } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { 
          utilizator: { 
            OR: [
              { nume: { contains: search, mode: 'insensitive' } },
              { prenume: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }    // Execute queries
    const [auditLogs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          utilizator: {
            select: {
              id: true,
              nume: true,
              prenume: true,
              email: true,
              functie: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      logs: auditLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// POST - Create new audit log entry
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, userId, entityType, entityId, details } = body

    // Validation
    if (!action || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, userId' },
        { status: 400 }
      )
    }

    // Get IP address and user agent from headers
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Prepare data based on entity type
    const auditData = {
      actiune: action,
      utilizatorId: userId,
      detalii: details || null,
      ipAddress,
      userAgent,
      createdAt: new Date()
    }

    // Map entityType to appropriate field
    if (entityType === 'FISIER' && entityId) {
      auditData.fisierId = entityId
    } else if (entityType === 'INREGISTRARE' && entityId) {
      auditData.inregistrareId = entityId
    }

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: auditData,
      include: {
        utilizator: {
          select: {
            id: true,
            nume: true,
            prenume: true,
            email: true,
            functie: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: auditLog
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create audit log' },
      { status: 500 }
    )
  }
}
