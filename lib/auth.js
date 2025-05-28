/**
 * Bibliotecă pentru autentificare și autorizare
 * @fileoverview Funcții helper pentru JWT și verificarea permisiunilor
 */

import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

/**
 * Verifică și decodează un token JWT
 * @param {string} token - Token-ul JWT
 * @returns {Promise<Object>} - Payload-ul decodat
 */
export async function verifyToken(token) {
  if (!token) {
    throw new Error('Token lipsă')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
  } catch (error) {
    throw new Error('Token invalid')
  }
}

/**
 * Extrage token-ul din request (cookie sau header)
 * @param {Request} request - Request-ul Next.js
 * @returns {string|null} - Token-ul sau null
 */
export function extractToken(request) {
  // Încearcă din cookie
  const cookieToken = request.cookies.get('auth-token')?.value
  if (cookieToken) {
    return cookieToken
  }

  // Încearcă din header Authorization
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

/**
 * Middleware pentru autentificare
 * @param {Request} request - Request-ul Next.js
 * @returns {Promise<Object|NextResponse>} - Utilizatorul autentificat sau eroare
 */
export async function requireAuth(request) {
  const token = extractToken(request)
  
  if (!token) {
    return NextResponse.json(
      { error: 'Acces neautorizat - token lipsă' },
      { status: 401 }
    )
  }

  try {
    const decoded = await verifyToken(token)
    return decoded
  } catch (error) {
    return NextResponse.json(
      { error: 'Acces neautorizat - token invalid' },
      { status: 401 }
    )
  }
}

/**
 * Verifică dacă utilizatorul are o anumită permisiune
 * @param {Object} utilizator - Obiectul utilizator decodat din token
 * @param {string} permisiune - Numele permisiunii
 * @returns {boolean} - True dacă are permisiunea
 */
export function hasPermission(utilizator, permisiune) {
  return utilizator.permisiuni && utilizator.permisiuni.includes(permisiune)
}

/**
 * Verifică dacă utilizatorul are un anumit nivel de acces
 * @param {Object} utilizator - Obiectul utilizator decodat din token
 * @param {number} nivelMinim - Nivelul minim necesar (1-4)
 * @returns {boolean} - True dacă are nivelul necesar
 */
export function hasAccessLevel(utilizator, nivelMinim) {
  if (!utilizator.roluri || utilizator.roluri.length === 0) {
    return false
  }

  const nivelMaxim = Math.max(...utilizator.roluri.map(rol => rol.nivelAcces))
  return nivelMaxim >= nivelMinim
}

/**
 * Middleware pentru verificarea permisiunilor
 * @param {Request} request - Request-ul Next.js
 * @param {string|string[]} permisiuni - Permisiunea sau lista de permisiuni necesare
 * @returns {Promise<Object|NextResponse>} - Utilizatorul sau eroare
 */
export async function requirePermission(request, permisiuni) {
  const utilizator = await requireAuth(request)
  
  if (utilizator instanceof NextResponse) {
    return utilizator // Eroare de autentificare
  }

  const permisiuniNecesare = Array.isArray(permisiuni) ? permisiuni : [permisiuni]
  
  const arePermisiunea = permisiuniNecesare.some(perm => 
    hasPermission(utilizator, perm)
  )

  if (!arePermisiunea) {
    return NextResponse.json(
      { error: 'Acces interzis - permisiuni insuficiente' },
      { status: 403 }
    )
  }

  return utilizator
}

/**
 * Middleware pentru verificarea nivelului de acces
 * @param {Request} request - Request-ul Next.js
 * @param {number} nivelMinim - Nivelul minim necesar
 * @returns {Promise<Object|NextResponse>} - Utilizatorul sau eroare
 */
export async function requireAccessLevel(request, nivelMinim) {
  const utilizator = await requireAuth(request)
  
  if (utilizator instanceof NextResponse) {
    return utilizator // Eroare de autentificare
  }

  if (!hasAccessLevel(utilizator, nivelMinim)) {
    return NextResponse.json(
      { error: 'Acces interzis - nivel de acces insuficient' },
      { status: 403 }
    )
  }

  return utilizator
}

/**
 * Generează un hash pentru parolă
 * @param {string} parola - Parola în text clar
 * @returns {Promise<string>} - Hash-ul parolei
 */
export async function hashPassword(parola) {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(parola, 12)
}

/**
 * Verifică o parolă față de hash
 * @param {string} parola - Parola în text clar
 * @param {string} hash - Hash-ul stocat
 * @returns {Promise<boolean>} - True dacă parola este corectă
 */
export async function verifyPassword(parola, hash) {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(parola, hash)
}
