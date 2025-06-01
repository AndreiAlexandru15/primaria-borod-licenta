/**
 * API Route pentru registru
 * @fileoverview GET pentru registrele unui departament
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
 * GET /api/registru?departmentId={id}
 * Obține registrele unui departament
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
    }    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const an = searchParams.get('an') ? parseInt(searchParams.get('an')) : undefined;
    const toate = searchParams.get('toate') === 'true'; // Pentru admin - obține toate registrele

    if (!departmentId && !toate) {
      return NextResponse.json(
        { error: 'ID-ul departamentului este obligatoriu sau specifică toate=true pentru admin' },
        { status: 400 }
      )
    }

    let registre, listaAni;

    if (toate) {
      // Pentru admin - obține toate registrele din toate departamentele primăriei
      registre = await prisma.registru.findMany({
        where: {
          departament: {
            primariaId: primariaId
          },
          ...(an ? { an } : {})
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
        },
        orderBy: [
          { departament: { nume: 'asc' } },
          { createdAt: 'desc' }
        ]
      })

      // Lista de ani pentru toate registrele
      const aniDisponibili = await prisma.registru.findMany({
        where: {
          departament: {
            primariaId: primariaId
          }
        },
        select: { an: true },
        distinct: ['an'],
        orderBy: { an: 'desc' }
      });
      listaAni = aniDisponibili.map(r => r.an).sort((a, b) => b - a);
    } else {
      // Pentru departament specific - comportamentul existent
      // Verifică dacă departamentul există și aparține primăriei
      const departament = await prisma.departament.findFirst({
        where: {
          id: departmentId,
          primariaId: primariaId
        }
      })

      if (!departament) {
        return NextResponse.json(
          { error: 'Departamentul nu a fost găsit' },
          { status: 404 }
        )
      }

      // Obține registrele departamentului, cu filtrare după an dacă e cazul
      registre = await prisma.registru.findMany({
        where: {
          departamentId: departmentId,
          ...(an ? { an } : {})
        },
        include: {
          _count: {
            select: {
              inregistrari: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Extrage lista de ani disponibili pentru filtre (distinct)
      const aniDisponibili = await prisma.registru.findMany({
        where: { departamentId: departmentId },
        select: { an: true },
        distinct: ['an'],
        orderBy: { an: 'desc' }
      });
      listaAni = aniDisponibili.map(r => r.an).sort((a, b) => b - a);
    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data: registre,
      ani: listaAni
    }))

  } catch (error) {
    console.error('Eroare la obținerea registrelor:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/registru
 * Creează un registru nou
 */
export async function POST(request) {
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
    const hasPermission = permisiuni.includes('registre_creare') || 
                         permisiuni.includes('sistem_configurare')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Nu ai permisiunea să creezi registre' },
        { status: 403 }
      )
    }

    const { departamentId, nume, cod, descriere, tipRegistru, activ } = await request.json()

    // Validare input
    if (!departamentId) {
      return NextResponse.json(
        { error: 'ID-ul departamentului este obligatoriu' },
        { status: 400 }
      )
    }

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

    if (!tipRegistru) {
      return NextResponse.json(
        { error: 'Tipul registrului este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă departamentul există și aparține primăriei
    const departament = await prisma.departament.findFirst({
      where: {
        id: departamentId,
        primariaId: primariaId
      }
    })

    if (!departament) {
      return NextResponse.json(
        { error: 'Departamentul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Verifică dacă codul registrului este unic în departament
    const registruExistent = await prisma.registru.findFirst({
      where: {
        departamentId: departamentId,
        cod: cod.trim()
      }
    })

    if (registruExistent) {
      return NextResponse.json(
        { error: 'Un registru cu acest cod există deja în departament' },
        { status: 400 }
      )
    }

    // Creează registrul
    const registruNou = await prisma.registru.create({      data: {
        departamentId: departamentId,
        nume: nume.trim(),
        cod: cod.trim(),
        descriere: descriere?.trim() || null,
        tipRegistru: tipRegistru,
        activ: activ !== undefined ? activ : true
      },
      include: {
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
        actiune: 'REGISTRU_CREAT',
        detalii: {
          registruId: registruNou.id,
          nume: registruNou.nume,
          cod: registruNou.cod,
          departamentId: departamentId
        }
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      message: 'Registru creat cu succes',
      data: registruNou
    }))

  } catch (error) {
    console.error('Eroare la crearea registrului:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
