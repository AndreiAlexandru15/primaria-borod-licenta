import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

// GET - Listează tipurile de documente pentru un registru sau toate tipurile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const registruId = searchParams.get('registruId')
    const toate = searchParams.get('toate') // Pentru admin - obține toate tipurile

    // Construiește condiția where
    let whereCondition = {}
    
    if (registruId) {
      whereCondition.registruId = registruId
    }
    
    // Pentru admin, nu filtram după activ dacă este cerut explicit
    if (!toate) {
      whereCondition.activ = true
    }

    const tipuriDocumente = await prisma.tipDocument.findMany({
      where: whereCondition,
      include: {
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true,
            descriere: true,
            perioadaRetentie: true,
          }
        }
      },
      orderBy: [
        { ordineSortare: 'asc' },
        { nume: 'asc' }      ]
    })

    console.log('Tipuri documente găsite:', JSON.stringify({
      registruId: registruId || 'toate',
      count: tipuriDocumente.length,
      tipuri: tipuriDocumente.map(t => ({ id: t.id, nume: t.nume, cod: t.cod }))
    }, null, 2))

    return NextResponse.json(serializeBigInt({
      success: true,
      data: tipuriDocumente
    }))
  } catch (error) {
    console.error('Eroare la încărcarea tipurilor de documente:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-au putut încărca tipurile de documente',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Creează tip document nou
export async function POST(request) {
  try {
    const body = await request.json()
    const { registruId, categorieId, nume, cod, descriere, ordineSortare } = body

    if (!registruId) {
      return NextResponse.json(
        { success: false, error: 'ID-ul registrului este obligatoriu' },
        { status: 400 }
      )
    }

    if (!nume?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Numele tipului de document este obligatoriu' },
        { status: 400 }
      )
    }

    if (!cod?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Codul tipului de document este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă registrul există
    const registru = await prisma.registru.findUnique({
      where: { id: registruId }
    })

    if (!registru) {
      return NextResponse.json(
        { success: false, error: 'Registrul specificat nu există' },
        { status: 404 }
      )
    }

    // Verifică dacă categoria există (dacă este specificată)
    if (categorieId) {
      const categorie = await prisma.categorieDocument.findUnique({
        where: { id: categorieId }
      })
      if (!categorie) {
        return NextResponse.json(
          { success: false, error: 'Categoria specificată nu există' },
          { status: 400 }
        )
      }
    }

    // Verifică dacă codul este unic în cadrul registrului
    const tipExistent = await prisma.tipDocument.findFirst({
      where: {
        registruId,
        cod: cod.trim(),
        activ: true
      }
    })

    if (tipExistent) {
      return NextResponse.json(
        { success: false, error: 'Codul tipului de document există deja în acest registru' },
        { status: 400 }
      )
    }

    const tipDocumentNou = await prisma.tipDocument.create({
      data: {
        registruId,
        categorieId: categorieId || null,
        nume: nume.trim(),
        cod: cod.trim(),
        descriere: descriere?.trim() || null,
        ordineSortare: ordineSortare || 0,
        activ: true
      },
      include: {
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true,
            descriere: true,
            perioadaRetentie: true
          }
        }
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: tipDocumentNou,
      message: 'Tipul de document a fost creat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la crearea tipului de document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut crea tipul de document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizează tip document
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, categorieId, nume, cod, descriere, ordineSortare, activ } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul tipului de document este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă tipul de document există
    const tipExistent = await prisma.tipDocument.findUnique({
      where: { id }
    })

    if (!tipExistent) {
      return NextResponse.json(
        { success: false, error: 'Tipul de document specificat nu există' },
        { status: 404 }
      )
    }

    // Verifică dacă categoria există (dacă este specificată)
    if (categorieId) {
      const categorie = await prisma.categorieDocument.findUnique({
        where: { id: categorieId }
      })
      if (!categorie) {
        return NextResponse.json(
          { success: false, error: 'Categoria specificată nu există' },
          { status: 400 }
        )
      }
    }

    // Verifică unicitatea codului (dacă se schimbă)
    if (cod && cod.trim() !== tipExistent.cod) {
      const tipCuCodExistent = await prisma.tipDocument.findFirst({
        where: {
          registruId: tipExistent.registruId,
          cod: cod.trim(),
          activ: true,
          id: { not: id }
        }
      })

      if (tipCuCodExistent) {
        return NextResponse.json(
          { success: false, error: 'Codul tipului de document există deja în acest registru' },
          { status: 400 }
        )
      }
    }

    const tipDocumentActualizat = await prisma.tipDocument.update({
      where: { id },
      data: {
        categorieId: categorieId || null,
        nume: nume?.trim() || tipExistent.nume,
        cod: cod?.trim() || tipExistent.cod,
        descriere: descriere?.trim() || null,
        ordineSortare: ordineSortare ?? tipExistent.ordineSortare,
        activ: activ ?? tipExistent.activ
      },
      include: {
        registru: {
          select: {
            id: true,
            nume: true,
            cod: true
          }
        },
        categorie: {
          select: {
            id: true,
            nume: true,
            cod: true,
            descriere: true,
            perioadaRetentie: true,
            culoare: true
          }
        }
      }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: tipDocumentActualizat,
      message: 'Tipul de document a fost actualizat cu succes'
    }))

  } catch (error) {
    console.error('Eroare la actualizarea tipului de document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut actualiza tipul de document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Șterge tip document (soft delete)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID-ul tipului de document este obligatoriu' },
        { status: 400 }
      )
    }

    // Verifică dacă tipul de document există
    const tipExistent = await prisma.tipDocument.findUnique({
      where: { id }
    })

    if (!tipExistent) {
      return NextResponse.json(
        { success: false, error: 'Tipul de document specificat nu există' },
        { status: 404 }
      )
    }

    // Verifică dacă există înregistrări asociate
    const inregistrariAsociate = await prisma.inregistrare.count({
      where: { tipDocumentId: id }
    })

    if (inregistrariAsociate > 0) {
      // Soft delete dacă există înregistrări asociate
      await prisma.tipDocument.update({
        where: { id },
        data: { activ: false }
      })

      return NextResponse.json({
        success: true,
        message: `Tipul de document a fost dezactivat (există ${inregistrariAsociate} înregistrări asociate)`
      })
    } else {
      // Hard delete dacă nu există înregistrări asociate
      await prisma.tipDocument.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        message: 'Tipul de document a fost șters complet'
      })
    }

  } catch (error) {
    console.error('Eroare la ștergerea tipului de document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu s-a putut șterge tipul de document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}