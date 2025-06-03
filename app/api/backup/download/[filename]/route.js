import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import path from 'path'
import fs from 'fs/promises'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

/**
 * GET /api/backup/download/[filename]
 * Download a backup file
 */
export async function GET(request, { params }) {
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

    const { filename } = await params

    if (!filename) {
      return NextResponse.json(
        { error: 'Numele fișierului este obligatoriu' },
        { status: 400 }
      )
    }

    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Numele fișierului nu este valid' },
        { status: 400 }
      )
    }

    // Ensure file has .sql extension
    if (!filename.endsWith('.sql')) {
      return NextResponse.json(
        { error: 'Doar fișierele .sql pot fi descărcate' },
        { status: 400 }
      )
    }

    const backupPath = path.join(BACKUP_DIR, filename)

    // Verify file exists
    try {
      await fs.access(backupPath)
    } catch {
      return NextResponse.json(
        { error: 'Fișierul de backup nu a fost găsit' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(backupPath)
    
    // Return file as download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare la descărcarea backup-ului',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
