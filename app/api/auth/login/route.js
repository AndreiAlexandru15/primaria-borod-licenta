/**
 * API Route pentru autentificare utilizatori
 * @fileoverview Endpoint pentru login/logout în aplicația e-registratură
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/login
 * Autentificare utilizator
 */
export async function POST(request) {
  try {
    const { email, parola } = await request.json()
    
    // Debug login
    console.log('🔍 LOGIN DEBUG - Email:', email)
    console.log('🔍 LOGIN DEBUG - Parola length:', parola?.length)

    // Validare input
    if (!email || !parola) {
      console.log('❌ LOGIN DEBUG - Email sau parola lipsesc')
      return NextResponse.json(
        { error: 'Email și parola sunt obligatorii' },
        { status: 400 }
      )
    }

    // Găsește utilizatorul în baza de date
    const utilizator = await prisma.utilizator.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        primaria: true,
        roluri: {
          where: { activ: true },
          include: {
            rol: {
              include: {
                permisiuni: {
                  include: {
                    permisiune: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!utilizator) {
      return NextResponse.json(
        { error: 'Credențiale invalide' },
        { status: 401 }
      )
    }

    // Verifică dacă utilizatorul este activ
    if (!utilizator.activ) {
      return NextResponse.json(
        { error: 'Contul este dezactivat' },
        { status: 401 }
      )
    }

    // Verifică parola
    const parolaValida = await bcrypt.compare(parola, utilizator.parolaHash)
    if (!parolaValida) {
      return NextResponse.json(
        { error: 'Credențiale invalide' },
        { status: 401 }
      )
    }

    // Construiește obiectul cu permisiuni
    const permisiuni = []
    utilizator.roluri.forEach(utilizatorRol => {
      utilizatorRol.rol.permisiuni.forEach(rolPermisiune => {
        if (!permisiuni.includes(rolPermisiune.permisiune.nume)) {
          permisiuni.push(rolPermisiune.permisiune.nume)
        }
      })
    })

    // Creează token JWT
    const tokenPayload = {
      utilizatorId: utilizator.id,
      email: utilizator.email,
      nume: utilizator.nume,
      prenume: utilizator.prenume,
      primariaId: utilizator.primariaId,
      primariaNume: utilizator.primaria?.nume,
      roluri: utilizator.roluri.map(ur => ({
        id: ur.rol.id,
        nume: ur.rol.nume,
        nivelAcces: ur.rol.nivelAcces
      })),
      permisiuni
    }    // Generează JWT token folosind jose pentru compatibilitate cu Edge Runtime
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Actualizează ultima logare
    await prisma.utilizator.update({
      where: { id: utilizator.id },
      data: { ultimaLogare: new Date() }
    })

    // Log audit pentru login
    await prisma.auditLog.create({
      data: {
        utilizatorId: utilizator.id,
        actiune: 'LOGIN',
        detalii: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    const response = NextResponse.json({
      success: true,
      utilizator: {
        id: utilizator.id,
        email: utilizator.email,
        nume: utilizator.nume,
        prenume: utilizator.prenume,
        functie: utilizator.functie,
        primaria: utilizator.primaria,
        roluri: utilizator.roluri.map(ur => ur.rol),
        permisiuni
      }
    })

    // Setează cookie-ul cu token-ul
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 ore
    })

    return response

  } catch (error) {
    console.error('Eroare login:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
