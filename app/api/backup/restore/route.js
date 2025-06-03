import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const BACKUP_DIR = path.join(process.cwd(), 'backups')

/**
 * POST /api/backup/restore
 * Restore database from backup file
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

    // Verifică permisiuni pentru backup/restore
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
        { error: 'Nu ai permisiuni pentru operațiuni de backup/restore' },
        { status: 403 }
      )
    }

    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { error: 'Numele fișierului de backup este obligatoriu' },
        { status: 400 }
      )
    }

    const backupPath = path.join(BACKUP_DIR, filename)

    // Verify backup file exists
    try {
      await fs.access(backupPath)
    } catch {
      return NextResponse.json(
        { error: 'Fișierul de backup nu a fost găsit' },
        { status: 404 }
      )
    }

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

    console.log(`Starting restore from backup: ${filename}`)

    // Create a backup of current database before restore (safety measure)
    const preRestoreBackupFilename = `pre_restore_${Date.now()}_${filename}`
    const preRestoreBackupPath = path.join(BACKUP_DIR, preRestoreBackupFilename)

    const preBackupCommand = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${preRestoreBackupPath}" --verbose --clean --if-exists --create`
    
    // Set environment variable for password
    const env = { ...process.env, PGPASSWORD: dbPassword }

    try {
      console.log('Creating pre-restore backup...')
      await execAsync(preBackupCommand, { env })
      console.log(`Pre-restore backup created: ${preRestoreBackupFilename}`)
    } catch (preBackupError) {
      console.warn('Warning: Could not create pre-restore backup:', preBackupError.message)
      // Continue with restore anyway, but log the warning
    }

    // Execute restore using psql
    const restoreCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${backupPath}" -v ON_ERROR_STOP=1`

    console.log('Executing database restore...')
    
    const { stdout, stderr } = await execAsync(restoreCommand, { 
      env,
      timeout: 300000 // 5 minutes timeout for large backups
    })

    if (stderr && !stderr.includes('NOTICE:') && !stderr.includes('WARNING:')) {
      console.error('Restore stderr:', stderr)
      throw new Error(`Eroare în timpul restore-ului: ${stderr}`)
    }

    // Log successful restore in audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'RESTORE_BACKUP',
        detalii: {
          backupFile: filename,
          preRestoreBackup: preRestoreBackupFilename,
          restoreTimestamp: new Date().toISOString()
        }
      }
    })

    console.log(`Database restored successfully from: ${filename}`)

    return NextResponse.json({
      success: true,
      message: 'Baza de date a fost restaurată cu succes',
      data: {
        restoredFrom: filename,
        preRestoreBackup: preRestoreBackupFilename,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error restoring backup:', error)
    
    // Log failed restore attempt
    try {
      await prisma.auditLog.create({
        data: {
          utilizatorId: userId,
          actiune: 'RESTORE_BACKUP_FAILED',
          detalii: {
            backupFile: filename || 'unknown',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (auditError) {
      console.error('Error logging failed restore:', auditError)
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare la restaurarea backup-ului',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
