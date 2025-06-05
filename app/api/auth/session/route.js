/**
 * API Route pentru verificarea sesiunii
 * @fileoverview Endpoint pentru verificarea stării autentificării utilizatorului
 */

import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/auth/session
 * Verifică sesiunea curentă a utilizatorului
 */
export async function GET(request) {
  try {
    // Încearcă să extragă token-ul din cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Nu există sesiune activă' },
        { status: 200 } // 200 pentru a nu fi considerată eroare
      )
    }

    // Verifică validitatea token-ului
    try {
      const decoded = await verifyToken(token)
      
      // Returnează informațiile utilizatorului din token
      return NextResponse.json({
        success: true,
        utilizator: {
          id: decoded.utilizatorId,
          email: decoded.email,
          nume: decoded.nume,
          prenume: decoded.prenume,
          functie: decoded.functie || null,
          primaria: decoded.primariaNume ? {
            id: decoded.primariaId,
            nume: decoded.primariaNume
          } : null,
          roluri: decoded.roluri || [],
          permisiuni: decoded.permisiuni || []
        }
      })
    } catch (tokenError) {
      // Token invalid sau expirat
      return NextResponse.json(
        { success: false, message: 'Sesiune expirată' },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Eroare la verificarea sesiunii:', error)
    return NextResponse.json(
      { success: false, message: 'Eroare la verificarea sesiunii' },
      { status: 500 }
    )
  }
}
