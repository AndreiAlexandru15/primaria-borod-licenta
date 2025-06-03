import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// Configurare pentru backup
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const MAX_BACKUP_SIZE = 1024 * 1024 * 1024 * 5 // 5GB

/**
 * Check if pg_dump is available
 */
async function checkPgDumpAvailable() {
  try {
    await execAsync('pg_dump --version')
    return true
  } catch (error) {
    return false
  }
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR)
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
  }
}

/**
 * Generate backup filename
 */
function generateBackupFilename(type = 'manual') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `backup_${type}_${timestamp}.sql`
}

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  } catch {
    return 0
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * GET /api/backup
 * List all available backups
 */
export async function GET(request) {
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

    // Verifică permisiuni pentru backup
    const user = await prisma.utilizator.findUnique({
      where: { id: userId },
      include: {
        roluri: {
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

    const hasBackupPermission = user?.roluri.some(ur => 
      ur.rol.permisiuni.some(rp => 
        rp.permisiune.nume === 'sistem_backup'
      )
    )

    if (!hasBackupPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiuni pentru operațiuni de backup' },
        { status: 403 }
      )
    }

    await ensureBackupDir()

    // List all backup files
    const files = await fs.readdir(BACKUP_DIR)
    const backupFiles = files.filter(file => file.endsWith('.sql'))

    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file)
        const stats = await fs.stat(filePath)
        const size = await getFileSize(filePath)
        
        // Extract type from filename
        const type = file.includes('manual') ? 'Manual' : 'Automatic'
        
        return {
          id: file.replace('.sql', ''),
          name: file,
          size: formatFileSize(size),
          sizeBytes: size,
          created: stats.birthtime.toISOString(),
          type,
          status: 'Completed'
        }
      })
    )

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.created) - new Date(a.created))

    return NextResponse.json({
      success: true,
      data: backups
    })

  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare la listarea backup-urilor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/backup
 * Create a new backup
 */
export async function POST(request) {
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

    // Verifică permisiuni pentru backup
    const user = await prisma.utilizator.findUnique({
      where: { id: userId },
      include: {
        roluri: {
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
      }    })

    const hasBackupPermission = user?.roluri.some(ur => 
      ur.rol.permisiuni.some(rp => 
        rp.permisiune.nume === 'sistem_backup'
      )
    )

    if (!hasBackupPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiuni pentru operațiuni de backup' },
        { status: 403 }
      )
    }

    // Check if pg_dump is available
    const pgDumpAvailable = await checkPgDumpAvailable()
    if (!pgDumpAvailable) {
      return NextResponse.json({
        error: 'PostgreSQL client tools nu sunt instalate',
        message: 'Pentru a crea backup-uri, trebuie să instalezi PostgreSQL client tools.',
        instructions: {
          windows: [
            '1. Descarcă PostgreSQL de la https://www.postgresql.org/download/windows/',
            '2. Instalează PostgreSQL (poți alege doar client tools)',
            '3. Adaugă calea către PostgreSQL\\bin în variabila PATH',
            '4. Alternativ, poți instala doar pg_dump folosind Chocolatey: choco install postgresql'
          ],
          alternative: 'Sau poți folosi un backup SQL export din Supabase Dashboard'
        }
      }, { status: 400 })
    }

    const { type = 'manual' } = await request.json()

    await ensureBackupDir()

    const backupFilename = generateBackupFilename(type)
    const backupPath = path.join(BACKUP_DIR, backupFilename)

    // Get database connection details from environment
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL nu este configurată')
    }

    // Parse database URL
    const url = new URL(databaseUrl)
    const dbHost = url.hostname
    const dbPort = url.port || '5432'
    const dbName = url.pathname.slice(1)
    const dbUser = url.username
    const dbPassword = url.password

    // Create pg_dump command
    const pgDumpCommand = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${backupPath}" --verbose --clean --if-exists --create`

    // Set environment variable for password
    const env = { ...process.env, PGPASSWORD: dbPassword }

    console.log(`Creating backup: ${backupFilename}`)
    
    // Execute pg_dump
    const { stdout, stderr } = await execAsync(pgDumpCommand, { env })
    
    if (stderr && !stderr.includes('NOTICE:')) {
      console.warn('pg_dump warnings:', stderr)
    }

    // Verify backup was created and get its size
    const backupSize = await getFileSize(backupPath)
    
    if (backupSize === 0) {
      throw new Error('Backup-ul a fost creat dar este gol')
    }

    if (backupSize > MAX_BACKUP_SIZE) {
      await fs.unlink(backupPath) // Delete oversized backup
      throw new Error(`Backup-ul depășește dimensiunea maximă permisă (${formatFileSize(MAX_BACKUP_SIZE)})`)
    }

    // Log backup creation in audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'CREATE_BACKUP',
        detalii: {
          backupFile: backupFilename,
          backupSize: formatFileSize(backupSize),
          type: type
        }
      }
    })

    console.log(`Backup created successfully: ${backupFilename} (${formatFileSize(backupSize)})`)

    return NextResponse.json({
      success: true,
      message: 'Backup-ul a fost creat cu succes',
      data: {
        filename: backupFilename,
        size: formatFileSize(backupSize),
        sizeBytes: backupSize,
        created: new Date().toISOString(),
        type: type.charAt(0).toUpperCase() + type.slice(1)
      }
    })

  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare la crearea backup-ului',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/backup
 * Delete a backup file
 */
export async function DELETE(request) {
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

    // Verifică permisiuni pentru backup
    const user = await prisma.utilizator.findUnique({
      where: { id: userId },
      include: {
        roluri: {
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

    const hasBackupPermission = user?.roluri.some(ur => 
      ur.rol.permisiuni.some(rp => 
        rp.permisiune.nume === 'sistem_backup'
      )
    )

    if (!hasBackupPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiuni pentru operațiuni de backup' },
        { status: 403 }
      )
    }

    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { error: 'Numele fișierului este obligatoriu' },
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

    // Delete the backup file
    await fs.unlink(backupPath)

    // Log backup deletion in audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'DELETE_BACKUP',
        detalii: {
          backupFile: filename
        }
      }
    })

    console.log(`Backup deleted: ${filename}`)

    return NextResponse.json({
      success: true,
      message: 'Backup-ul a fost șters cu succes'
    })

  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare la ștergerea backup-ului',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
