/**
 * Middleware pentru autentificare și autorizare
 * @fileoverview Verifică autentificarea utilizatorilor și direcționează către login
 */

import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Rutele care nu necesită autentificare
 */
const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/logout']

/**
 * Rutele API care necesită autentificare
 */
const PROTECTED_API_ROUTES = ['/api/utilizatori', '/api/documente', '/api/departamente', '/api/registru']

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Blochează accesul la pagina principală '/'
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verifică dacă este rută publică
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Pentru rute statice, lasă să treacă
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/public/') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Obține token-ul din cookie
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // Dacă este rută API protejată, returnează 401
    if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }
    
    // Pentru alte rute, redirecționează la login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  try {
    // Verifică validitatea token-ului folosind jose pentru Edge Runtime
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    
    // Adaugă informațiile utilizatorului în header-ele request-ului
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.utilizatorId)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-primaria-id', payload.primariaId)
    requestHeaders.set('x-user-permissions', JSON.stringify(payload.permisiuni))

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
  } catch (error) {
    console.error('Token invalid:', error)
    
    // Șterge cookie-ul invalid
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
