import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Check PostgreSQL tools availability
 */
export async function GET() {
  try {
    // Check if pg_dump is available
    let pgDumpAvailable = false
    let pgDumpVersion = null
    
    try {
      const { stdout } = await execAsync('pg_dump --version')
      pgDumpAvailable = true
      pgDumpVersion = stdout.trim()
    } catch (error) {
      pgDumpAvailable = false
    }

    // Check if psql is available
    let psqlAvailable = false
    let psqlVersion = null
    
    try {
      const { stdout } = await execAsync('psql --version')
      psqlAvailable = true
      psqlVersion = stdout.trim()
    } catch (error) {
      psqlAvailable = false
    }

    return NextResponse.json({
      success: true,
      data: {
        pgDumpAvailable,
        pgDumpVersion,
        psqlAvailable,
        psqlVersion,
        canCreateBackups: pgDumpAvailable,
        canRestoreBackups: psqlAvailable,
        instructions: {
          title: 'Instalare PostgreSQL Client Tools',
          description: 'Pentru a utiliza funcționalitatea de backup, instalează PostgreSQL client tools:',
          steps: [
            'Descarcă PostgreSQL de la https://www.postgresql.org/download/windows/',
            'Instalează PostgreSQL (selectează "Command Line Tools")',
            'Adaugă PostgreSQL\\bin în variabila PATH din sistem',
            'Redeschide terminal-ul și încearcă din nou'
          ],
          downloadUrl: 'https://www.postgresql.org/download/windows/',
          alternative: 'Alternativ, poți exporta baza de date din Supabase Dashboard → Settings → Database → Database backups'
        }
      }
    })
  } catch (error) {
    console.error('Error checking PostgreSQL tools:', error)
    return NextResponse.json(
      { error: 'Eroare la verificarea tool-urilor PostgreSQL' },
      { status: 500 }
    )
  }
}
