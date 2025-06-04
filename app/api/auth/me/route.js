// API route: /api/auth/me
// Returns the current logged-in user based on the JWT cookie
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Use next/headers cookies for App Router
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nu ești autentificat' }, { status: 401 });
    }
    const user = await verifyToken(token);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Token invalid sau expirat' }, { status: 401 });
  }
}
