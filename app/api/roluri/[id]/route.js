import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Serializează BigInt pentru JSON
 */
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

/**
 * GET /api/roluri/[id]
 * Obține un rol specific cu permisiunile sale
 */
export async function GET(request, { params }) {
  try {
    const awaitedParams = await params
    const { id } = awaitedParams

    const rol = await prisma.rol.findUnique({
      where: { id },
      include: {
        permisiuni: {
          include: {
            permisiune: {
              select: {
                id: true,
                nume: true,
                descriere: true,
                modul: true,
                actiune: true
              }
            }
          }
        },
        utilizatori: {
          include: {
            utilizator: {
              select: {
                id: true,
                nume: true,
                prenume: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!rol) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rolul nu a fost găsit' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: serializeBigInt(rol)
    })

  } catch (error) {
    console.error('Eroare la obținerea rolului:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Eroare internă la obținerea rolului' 
    }, { status: 500 })
  }
}

/**
 * PUT /api/roluri/[id]
 * Actualizează un rol și permisiunile sale
 */
export async function PUT(request, { params }) {
  try {
    const awaitedParams = await params
    const { id } = awaitedParams
    const body = await request.json()
    const { nume, descriere, nivelAcces, sistem, permisiuni = [] } = body

    // Validări
    if (!nume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Numele rolului este obligatoriu' 
      }, { status: 400 })
    }

    if (!nivelAcces || nivelAcces < 1 || nivelAcces > 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nivelul de acces trebuie să fie între 1 și 10' 
      }, { status: 400 })
    }

    // Verifică dacă rolul există
    const existingRole = await prisma.rol.findUnique({
      where: { id },
      include: {
        permisiuni: true
      }
    })

    if (!existingRole) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rolul nu a fost găsit' 
      }, { status: 404 })
    }

    // Verifică dacă un alt rol are același nume
    const duplicateRole = await prisma.rol.findFirst({
      where: {
        nume: nume.trim(),
        activ: true,
        id: { not: id }
      }
    })

    if (duplicateRole) {
      return NextResponse.json({ 
        success: false, 
        error: 'Există deja un alt rol cu acest nume' 
      }, { status: 400 })
    }

    // Începe tranzacția pentru actualizarea rolului și permisiunilor
    const updatedRole = await prisma.$transaction(async (tx) => {
      // Actualizează rolul
      const rol = await tx.rol.update({
        where: { id },
        data: {
          nume: nume.trim(),
          descriere: descriere?.trim() || '',
          nivelAcces: parseInt(nivelAcces),
          sistem: Boolean(sistem)
        }
      })

      // Șterge toate permisiunile existente
      await tx.rolPermisiune.deleteMany({
        where: { rolId: id }
      })

      // Adaugă noile permisiuni
      if (permisiuni.length > 0) {
        // Verifică că toate permisiunile există
        const existingPermissions = await tx.permisiune.findMany({
          where: {
            id: { in: permisiuni }
          }
        })

        if (existingPermissions.length !== permisiuni.length) {
          throw new Error('Unele permisiuni nu există în sistem')
        }

        // Creează relațiile rol-permisiune
        const rolPermisiuneData = permisiuni.map(permisiuneId => ({
          rolId: id,
          permisiuneId: permisiuneId
        }))

        await tx.rolPermisiune.createMany({
          data: rolPermisiuneData
        })
      }

      // Returnează rolul actualizat cu permisiunile
      return await tx.rol.findUnique({
        where: { id },
        include: {
          permisiuni: {
            include: {
              permisiune: {
                select: {
                  id: true,
                  nume: true,
                  descriere: true,
                  modul: true,
                  actiune: true
                }
              }
            }
          }
        }
      })
    })

    return NextResponse.json({ 
      success: true, 
      data: serializeBigInt(updatedRole),
      message: 'Rolul a fost actualizat cu succes'
    })

  } catch (error) {
    console.error('Eroare la actualizarea rolului:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Eroare internă la actualizarea rolului' 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/roluri/[id]
 * Șterge un rol (doar dacă nu este rol de sistem și nu este atribuit utilizatorilor)
 */
export async function DELETE(request, { params }) {
  try {
    const awaitedParams = await params
    const { id } = awaitedParams

    // Verifică dacă rolul există
    const existingRole = await prisma.rol.findUnique({
      where: { id },
      include: {
        utilizatori: true
      }
    })

    if (!existingRole) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rolul nu a fost găsit' 
      }, { status: 404 })
    }

    // Verifică dacă este rol de sistem
    if (existingRole.sistem) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rolurile de sistem nu pot fi șterse' 
      }, { status: 400 })
    }

    // Verifică dacă rolul este atribuit unor utilizatori
    if (existingRole.utilizatori.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rolul nu poate fi șters deoarece este atribuit unor utilizatori' 
      }, { status: 400 })
    }

    // Șterge rolul și toate relațiile sale
    await prisma.$transaction(async (tx) => {
      // Șterge relațiile rol-permisiune
      await tx.rolPermisiune.deleteMany({
        where: { rolId: id }
      })

      // Marchează rolul ca inactiv în loc să îl șteargă complet
      await tx.rol.update({
        where: { id },
        data: { activ: false }
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Rolul a fost șters cu succes'
    })

  } catch (error) {
    console.error('Eroare la ștergerea rolului:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Eroare internă la ștergerea rolului' 
    }, { status: 500 })
  }
}
