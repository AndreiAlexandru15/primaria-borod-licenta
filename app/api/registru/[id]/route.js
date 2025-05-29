/**
 * API Route pentru operațiuni individuale pe registru
 * @fileoverview GET, PUT, DELETE pentru registru specific
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

/**
 * GET /api/registru/[id]
 * Obține un registru specific
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

    const { id } = await params
    
    const registru = await prisma.registru.findFirst({
      where: {
        id: id,
        departament: {
          primariaId: primariaId
        }
      },
      include: {
        departament: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        _count: {
          select: {
            inregistrari: true
          }
        }
      }
    })

    if (!registru) {
      return NextResponse.json(
        { error: 'Registrul nu a fost găsit' },
        { status: 404 }
      )
    }    return NextResponse.json(serializeBigInt({
      success: true,
      data: registru
    }))

  } catch (error) {
    console.error('Eroare la obținerea registrului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/registru/[id]
 * Actualizează un registru
 */
export async function PUT(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')
    const permisiuni = JSON.parse(headersList.get('x-user-permissions') || '[]')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    // Verifică permisiunile
    const hasPermission = permisiuni.includes('registre_editare') || 
                         permisiuni.includes('sistem_configurare')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiunea să editezi registre' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { nume, cod, descriere, tipRegistru, activ } = await request.json()

    // Verifică dacă registrul există
    const registruExistent = await prisma.registru.findFirst({
      where: {
        id: id,
        departament: {
          primariaId: primariaId
        }
      },      include: {
        departament: true,
        _count: {
          select: {
            inregistrari: true
          }
        }
      }
    })

    if (!registruExistent) {
      return NextResponse.json(
        { error: 'Registrul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Validare input
    if (!nume || nume.trim().length < 2) {
      return NextResponse.json(
        { error: 'Numele registrului este obligatoriu (min. 2 caractere)' },
        { status: 400 }
      )
    }

    if (!cod || cod.trim().length < 2) {
      return NextResponse.json(
        { error: 'Codul registrului este obligatoriu (min. 2 caractere)' },
        { status: 400 }
      )
    }

    if (!tipRegistru || !['intrare', 'iesire', 'intern', 'intrare_iesire'].includes(tipRegistru)) {
      return NextResponse.json(
        { error: 'Tipul registrului nu este valid' },
        { status: 400 }      )
    }

    // Verifică dacă codul se încearcă să fie modificat și registrul are înregistrări
    const areInregistrari = registruExistent._count.inregistrari > 0
    const codSeModifica = cod.trim() !== registruExistent.cod

    if (codSeModifica && areInregistrari) {
      return NextResponse.json(
        { 
          error: `Codul registrului nu poate fi modificat deoarece există ${registruExistent._count.inregistrari} înregistrări` 
        },
        { status: 400 }
      )
    }

    // Verifică dacă alt registru cu același nume există în același departament
    const duplicatNume = await prisma.registru.findFirst({
      where: {
        nume: nume.trim(),
        departamentId: registruExistent.departamentId,
        id: { not: id }
      }
    })

    if (duplicatNume) {
      return NextResponse.json(
        { error: 'Un alt registru cu acest nume există deja în departament' },
        { status: 400 }
      )
    }

    // Verifică dacă alt registru cu același cod există (doar dacă codul se modifică)
    if (codSeModifica) {
      const duplicatCod = await prisma.registru.findFirst({
        where: {
          cod: cod.trim(),
          departament: {
            primariaId: primariaId
          },
          id: { not: id }
        }
      })

      if (duplicatCod) {
        return NextResponse.json(
          { error: 'Un alt registru cu acest cod există deja' },
          { status: 400 }
        )
      }
    }

    // Pregătește datele pentru actualizare
    const dataUpdate = {
      nume: nume.trim(),
      descriere: descriere?.trim() || null,
      tipRegistru: tipRegistru,      activ: activ !== false
    }

    // Adaugă codul doar dacă se poate modifica
    if (!areInregistrari) {
      dataUpdate.cod = cod.trim()
    }

    // Actualizează registrul
    const registruActualizat = await prisma.registru.update({
      where: { id: id },
      data: dataUpdate,
      include: {
        departament: {
          select: {
            id: true,
            nume: true
          }
        },
        _count: {
          select: {
            inregistrari: true
          }
        }
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'REGISTRU_ACTUALIZAT',
        detalii: {
          registruId: id,
          nume: registruActualizat.nume,
          departamentId: registruActualizat.departamentId,
          modificari: { nume, cod: dataUpdate.cod, descriere, tipRegistru, activ }
        }
      }
    })    
    return NextResponse.json(serializeBigInt({
      success: true,
      message: 'Registru actualizat cu succes',
      data: registruActualizat
    }))

  } catch (error) {
    console.error('Eroare la actualizarea registrului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/registru/[id]
 * Șterge un registru
 */
export async function DELETE(request, { params }) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')
    const permisiuni = JSON.parse(headersList.get('x-user-permissions') || '[]')

    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    // Verifică permisiunile
    const hasPermission = permisiuni.includes('registre_stergere') || 
                         permisiuni.includes('sistem_configurare')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiunea să ștergi registre' },
        { status: 403 }
      )
    }

    const { id } = await params    // Verifică dacă registrul există
    const registru = await prisma.registru.findFirst({
      where: {
        id: id,
        departament: {
          primariaId: primariaId
        }
      },      include: {
        _count: {
          select: {
            inregistrari: true
          }
        }
      }
    })

    if (!registru) {
      return NextResponse.json(
        { error: 'Registrul nu a fost găsit' },
        { status: 404 }
      )
    }    // Verifică dacă registrul are înregistrări asociate
    if (registru._count.inregistrari > 0) {
      return NextResponse.json(
        { 
          error: `Nu se poate șterge registrul deoarece conține ${registru._count.inregistrari} înregistrar${registru._count.inregistrari > 1 ? 'i' : 'e'}. Ștergeți mai întâi toate înregistrările din registru.`,
          code: 'HAS_REGISTRATIONS'
        },
        { status: 400 }
      )
    }

    // Șterge registrul
    await prisma.registru.delete({
      where: { id: id }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        utilizatorId: userId,
        actiune: 'REGISTRU_STERS',
        detalii: {
          registruId: id,
          nume: registru.nume
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registru șters cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea registrului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
