/**
 * API Route pentru logout
 * @fileoverview Endpoint pentru delogare utilizatori
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * POST /api/auth/logout
 * Delogare utilizator
 */
export async function POST(request) {
  try {
    // Verifică token-ul din cookie
    const token = request.cookies.get('auth-token')?.value
    
    if (token) {
      try {
        const decoded = await verifyToken(token)
        
        // Log audit pentru logout
        await prisma.auditLog.create({
          data: {
            utilizatorId: decoded.utilizatorId,
            actiune: 'LOGOUT',
            detalii: {
              ip: request.headers.get('x-forwarded-for') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          }
        })
      } catch (error) {
        // Token invalid, dar continuăm cu logout
        console.log('Token invalid la logout:', error.message)
      }
    }

    // Creează response și șterge cookie-ul
    const response = NextResponse.json({
      success: true,
      message: 'Delogare reușită'
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Șterge cookie-ul
    })

    return response

  } catch (error) {
    console.error('Eroare logout:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
