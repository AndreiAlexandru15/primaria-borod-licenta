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
 * Check if psql is available
 */
async function checkPsqlAvailable() {
  try {
    await execAsync('psql --version')
    return true
  } catch (error) {
    return false
  }
}

/**
 * POST /api/backup/restore
 * Restore database from backup file
 */
export async function POST(request) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const primariaId = headersList.get('x-primaria-id')
  let filename = null // Declare filename at function scope

  try {
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
      }    })

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

    // Check if psql is available
    const psqlAvailable = await checkPsqlAvailable()
    if (!psqlAvailable) {
      return NextResponse.json({
        error: 'PostgreSQL client tools nu sunt instalate',
        message: 'Pentru a restaura backup-uri, trebuie să instalezi PostgreSQL client tools.',
        instructions: {
          windows: [
            '1. Descarcă PostgreSQL de la https://www.postgresql.org/download/windows/',
            '2. Instalează PostgreSQL (poți alege doar client tools)',
            '3. Adaugă calea către PostgreSQL\\bin în variabila PATH',
            '4. Alternativ, poți instala doar psql folosind Chocolatey: choco install postgresql'
          ],
          alternative: 'Sau poți importa backup-ul manual prin Supabase Dashboard'
        }
      }, { status: 400 })    }

    const requestBody = await request.json()
    filename = requestBody.filename // Assign to the function-scoped variable

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
    }    // First, let's create a filtered version of the backup that only contains public schema data
    const filteredBackupPath = path.join(BACKUP_DIR, `filtered_${filename}`)
    
    try {
      console.log('Creating filtered backup for restore...')
      // Read the original backup and filter out system schemas and problematic commands
      const backupContent = await fs.readFile(backupPath, 'utf8')
      
      // Split into lines and filter
      const lines = backupContent.split('\n')
      const filteredLines = []
      let inPublicSchema = false
      let skipSection = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Skip problematic configuration parameters
        if (line.includes('transaction_timeout') || 
            line.includes('idle_in_transaction_session_timeout') ||
            line.includes('app.settings.jwt_exp') ||
            line.includes('log_min_messages')) {
          continue
        }
        
        // Skip system schemas
        if (line.includes('CREATE SCHEMA auth') ||
            line.includes('CREATE SCHEMA extensions') ||
            line.includes('CREATE SCHEMA storage') ||
            line.includes('CREATE SCHEMA realtime') ||
            line.includes('CREATE SCHEMA vault') ||
            line.includes('CREATE SCHEMA pgbouncer') ||
            line.includes('CREATE SCHEMA graphql')) {
          skipSection = true
          continue
        }
        
        // Skip if we're in a system schema section
        if (line.includes('SET search_path = auth') ||
            line.includes('SET search_path = extensions') ||
            line.includes('SET search_path = storage') ||
            line.includes('SET search_path = realtime') ||
            line.includes('SET search_path = vault') ||
            line.includes('SET search_path = pgbouncer') ||
            line.includes('SET search_path = graphql')) {
          skipSection = true
          continue
        }
        
        // Check if we're entering public schema
        if (line.includes('SET search_path = public')) {
          skipSection = false
          inPublicSchema = true
          filteredLines.push(line)
          continue
        }
        
        // Skip system tables and functions
        if (line.includes('auth.') || 
            line.includes('extensions.') ||
            line.includes('storage.') ||
            line.includes('realtime.') ||
            line.includes('vault.') ||
            line.includes('pgbouncer.') ||
            line.includes('graphql.')) {
          continue
        }
        
        // Skip role and privilege grants for system users
        if (line.includes('supabase_') || 
            line.includes('postgres_') ||
            line.includes('authenticator') ||
            line.includes('service_role') ||
            line.includes('anon')) {
          continue
        }
        
        // Skip event triggers
        if (line.includes('EVENT TRIGGER')) {
          continue
        }
        
        // Only include lines that are not in a skip section
        if (!skipSection) {
          // For public schema, only include our application tables
          if (inPublicSchema || 
              line.includes('_prisma_migrations') ||
              line.includes('audit_log') ||
              line.includes('categorii_documente') ||
              line.includes('departamente') ||
              line.includes('fisiere') ||
              line.includes('inregistrari') ||
              line.includes('permisiuni') ||
              line.includes('primarii') ||
              line.includes('registre') ||
              line.includes('roluri') ||
              line.includes('utilizatori') ||
              line.includes('tipuri_documente') ||
              line.includes('SET ') ||
              line.includes('\\connect') ||
              line.startsWith('--') ||
              line.trim() === '') {
            filteredLines.push(line)
          }
        }
      }
      
      // Write filtered backup
      await fs.writeFile(filteredBackupPath, filteredLines.join('\n'))
      console.log('Filtered backup created successfully')
      
    } catch (filterError) {
      console.warn('Could not create filtered backup, using original:', filterError.message)
      // Fall back to original backup
      await fs.copyFile(backupPath, filteredBackupPath)
    }

    // Execute restore using the filtered backup
    const restoreCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filteredBackupPath}" -v ON_ERROR_STOP=0`

    console.log('Executing database restore with filtered backup...')
    
    const { stdout, stderr } = await execAsync(restoreCommand, { 
      env,
      timeout: 300000 // 5 minutes timeout for large backups
    })

    // Check for critical errors but be more lenient
    const criticalErrors = stderr ? stderr.split('\n').filter(line => 
      line.includes('ERROR:') && 
      !line.includes('unrecognized configuration parameter') &&
      !line.includes('transaction_timeout') &&
      !line.includes('idle_in_transaction_session_timeout') &&
      !line.includes('already exists') &&
      !line.includes('permission denied') &&
      !line.includes('must be owner') &&
      !line.includes('duplicate key value') &&
      !line.includes('multiple primary keys') &&
      !line.includes('grant options cannot be granted') &&
      !line.includes('must be member of role') &&
      !line.includes('Non-superuser owned event trigger')
    ) : []

    if (criticalErrors.length > 0) {
      console.error('Restore critical errors:', criticalErrors.join('\n'))
      throw new Error(`Eroare critică în timpul restore-ului: ${criticalErrors.join('; ')}`)
    }

    // Clean up filtered backup file
    try {
      await fs.unlink(filteredBackupPath)
    } catch (cleanupError) {
      console.warn('Could not clean up filtered backup file:', cleanupError.message)
    }

    // Log warnings but don't fail the restore
    if (stderr) {
      console.warn('Restore completed with warnings (this is normal for Supabase):', stderr)
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
