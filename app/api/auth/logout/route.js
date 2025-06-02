/**
 * API Route pentru logout
 * @fileoverview Endpoint pentru delogare utilizatori
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLogFromRequest, AUDIT_ACTIONS } from '@/lib/audit'

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
        
        // Log audit pentru logout success
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.LOGOUT,
          userId: decoded.utilizatorId,
          details: {
            email: decoded.email,
            logoutSuccess: true,
            sessionDuration: 'unknown', // Poți calcula dacă ai timestamp-ul login-ului
            timestamp: new Date().toISOString()
          }
        })
      } catch (error) {
        // Token invalid, dar continuăm cu logout
        console.log('Token invalid la logout:', error.message)
        
        // Log audit pentru logout cu token invalid
        await createAuditLogFromRequest(request, {
          action: AUDIT_ACTIONS.LOGOUT,
          userId: null,
          details: {
            tokenInvalid: true,
            errorMessage: error.message,
            timestamp: new Date().toISOString()
          }
        })
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
