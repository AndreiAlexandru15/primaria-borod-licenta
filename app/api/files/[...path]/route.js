import { NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * GET /api/files/[...path] - Servește fișierele din storage local
 */
export async function GET(request, { params }) {
  try {
    const { path } = await params
    const fullPath = Array.isArray(path) ? path.join('/') : path
    
    // Construiește calea completă către fișier folosind FILES_PATH din .env
    const filesPath = process.env.FILES_PATH || join(process.cwd(), 'storage', 'files')
    const filePath = join(filesPath, fullPath)
    
    // Verifică dacă fișierul există
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Fișierul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică că fișierul este în directorul permis (securitate)
    const resolvedFilePath = require('path').resolve(filePath)
    const resolvedFilesPath = require('path').resolve(filesPath)
    if (!resolvedFilePath.startsWith(resolvedFilesPath)) {
      return NextResponse.json(
        { error: 'Acces interzis' },
        { status: 403 }
      )
    }

    // Obține informațiile despre fișier
    const fileStats = await stat(filePath)
    const fileBuffer = await readFile(filePath)
    
    // Determină tipul MIME bazat pe extensie
    const ext = fullPath.split('.').pop()?.toLowerCase() || ''
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain'
    }
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream'
    
    // Verifică parametrul de download
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'
    const fileName = fullPath.split('/').pop() || 'document'
    
    // Creează răspunsul cu headers corecte
    const response = new NextResponse(fileBuffer)
    
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Content-Length', fileStats.size.toString())
    
    if (download) {
      response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    } else {
      response.headers.set('Content-Disposition', `inline; filename="${fileName}"`)
    }
    
    // Cache headers pentru performanță
    response.headers.set('Cache-Control', 'public, max-age=3600')
    response.headers.set('ETag', `"${fileStats.mtime.getTime()}"`)
    
    return response

  } catch (error) {
    console.error('Eroare la servirea fișierului:', error)
    return NextResponse.json(
      { error: 'Eroare internă la servirea fișierului' },
      { status: 500 }
    )
  }
}