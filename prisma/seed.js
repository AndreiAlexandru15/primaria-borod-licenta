/**
 * Seed pentru baza de date - Date inițiale pentru aplicația E-Registratură
 * @fileoverview Populează baza de date cu roluri, permisiuni și date de bază
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Rolurile predefinite în sistem
 */
const ROLURI_INITIALE = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nume: 'Super Admin',
    descriere: 'Acces complet la sistem',
    nivelAcces: 4,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    nume: 'Administrator',
    descriere: 'Administrator primărie',
    nivelAcces: 3,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    nume: 'Operator Registratură',
    descriere: 'Operator pentru înregistrarea documentelor',
    nivelAcces: 2,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    nume: 'Arhivist',
    descriere: 'Responsabil cu arhivarea documentelor',
    nivelAcces: 2,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    nume: 'Cititor',
    descriere: 'Doar citirea documentelor',
    nivelAcces: 1,
    sistem: true
  }
]

/**
 * Permisiunile din sistem
 */
const PERMISIUNI_INITIALE = [
  // Permisiuni documente
  { id: '650e8400-e29b-41d4-a716-446655440001', nume: 'documente_citire', descriere: 'Citirea documentelor', modul: 'documente', actiune: 'citire' },
  { id: '650e8400-e29b-41d4-a716-446655440002', nume: 'documente_creare', descriere: 'Crearea documentelor noi', modul: 'documente', actiune: 'creare' },
  { id: '650e8400-e29b-41d4-a716-446655440003', nume: 'documente_editare', descriere: 'Editarea documentelor existente', modul: 'documente', actiune: 'editare' },
  { id: '650e8400-e29b-41d4-a716-446655440004', nume: 'documente_stergere', descriere: 'Ștergerea documentelor', modul: 'documente', actiune: 'stergere' },
  { id: '650e8400-e29b-41d4-a716-446655440005', nume: 'documente_export', descriere: 'Export documente', modul: 'documente', actiune: 'export' },
  { id: '650e8400-e29b-41d4-a716-446655440006', nume: 'documente_arhivare', descriere: 'Arhivarea documentelor', modul: 'documente', actiune: 'arhivare' },
  
  // Permisiuni utilizatori
  { id: '650e8400-e29b-41d4-a716-446655440007', nume: 'utilizatori_citire', descriere: 'Vizualizarea utilizatorilor', modul: 'utilizatori', actiune: 'citire' },
  { id: '650e8400-e29b-41d4-a716-446655440008', nume: 'utilizatori_creare', descriere: 'Crearea utilizatorilor', modul: 'utilizatori', actiune: 'creare' },
  { id: '650e8400-e29b-41d4-a716-446655440009', nume: 'utilizatori_editare', descriere: 'Editarea utilizatorilor', modul: 'utilizatori', actiune: 'editare' },
  { id: '650e8400-e29b-41d4-a716-446655440010', nume: 'utilizatori_stergere', descriere: 'Ștergerea utilizatorilor', modul: 'utilizatori', actiune: 'stergere' },
  
  // Permisiuni rapoarte
  { id: '650e8400-e29b-41d4-a716-446655440011', nume: 'rapoarte_vizualizare', descriere: 'Vizualizarea rapoartelor', modul: 'rapoarte', actiune: 'vizualizare' },
  { id: '650e8400-e29b-41d4-a716-446655440012', nume: 'rapoarte_export', descriere: 'Export rapoarte', modul: 'rapoarte', actiune: 'export' },
  { id: '650e8400-e29b-41d4-a716-446655440013', nume: 'rapoarte_avansate', descriere: 'Rapoarte avansate și statistici', modul: 'rapoarte', actiune: 'avansate' },
  
  // Permisiuni sistem
  { id: '650e8400-e29b-41d4-a716-446655440014', nume: 'sistem_configurare', descriere: 'Configurarea sistemului', modul: 'sistem', actiune: 'configurare' },
  { id: '650e8400-e29b-41d4-a716-446655440015', nume: 'sistem_backup', descriere: 'Gestionarea backup-urilor', modul: 'sistem', actiune: 'backup' },
  { id: '650e8400-e29b-41d4-a716-446655440016', nume: 'sistem_audit', descriere: 'Accesul la logurile de audit', modul: 'sistem', actiune: 'audit' },
  
  // Permisiuni fonduri arhivă
  { id: '650e8400-e29b-41d4-a716-446655440017', nume: 'fonduri_gestionare', descriere: 'Gestionarea fondurilor de arhivă', modul: 'fonduri', actiune: 'gestionare' },
  { id: '650e8400-e29b-41d4-a716-446655440018', nume: 'categorii_gestionare', descriere: 'Gestionarea categoriilor de documente', modul: 'categorii', actiune: 'gestionare' }
]

/**
 * Funcție principală de seed
 */
async function main() {
  console.log('🌱 Începe popularea bazei de date...')
  try {
    // 1. Șterge datele existente (în ordine pentru a respecta foreign keys)
    await prisma.utilizatorRol.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.inregistrare.deleteMany()
    await prisma.fisier.deleteMany()
    await prisma.tipDocument.deleteMany()
    await prisma.categorieDocument.deleteMany()
    await prisma.registru.deleteMany()
    await prisma.departament.deleteMany()
    await prisma.utilizator.deleteMany()
    await prisma.primaria.deleteMany()
    await prisma.rolPermisiune.deleteMany()
    await prisma.permisiune.deleteMany()
    await prisma.rol.deleteMany()
    await prisma.confidentialitateDocument.deleteMany()

    console.log('🗑️  Date existente șterse')

    // 2. Creează nivelurile de confidențialitate de bază
    const confidentialitati = [
      { cod: 'public', denumire: 'Public', descriere: 'Document accesibil publicului' },
      { cod: 'confidential', denumire: 'Confidențial', descriere: 'Document confidențial' },
      { cod: 'secret', denumire: 'Secret', descriere: 'Document secret' }
    ];
    const confidentialitateDocs = {};
    for (const conf of confidentialitati) {
      const c = await prisma.confidentialitateDocument.create({ data: conf });
      confidentialitateDocs[conf.cod] = c;
    }
    console.log('🔒 Confidentialități create');

    // 3. Creează primăria Borod
    const primariaTest = await prisma.primaria.create({
      data: {
        id: '450e8400-e29b-41d4-a716-446655440001',
        nume: 'Primăria Comunei Borod',
        codSiruta: '263457',
        judet: 'Bihor',
        localitate: 'Borod',
        adresa: 'Str. Principală nr. 1, Borod, Bihor',
        contactInfo: {
          telefon: '0259.123.456',
          email: 'primaria@borod.ro',
          website: 'www.primariaborod.ro'
        },
        configurari: {
          logoPath: null,
          culoareTema: '#0066cc',
          timezone: 'Europe/Bucharest'
        }
      }
    });
    console.log('🏛️  Primăria Borod creată')

    // 4. Creează rolurile
    for (const rol of ROLURI_INITIALE) {
      await prisma.rol.create({
        data: rol
      })
    }
    console.log('👥 Roluri create')

    // 5. Creează permisiunile
    for (const permisiune of PERMISIUNI_INITIALE) {
      await prisma.permisiune.create({
        data: permisiune
      })
    }
    console.log('🔐 Permisiuni create')

    // 6. Atribuie permisiuni la roluri

    // Super Admin - toate permisiunile
    const toatePermisiunile = await prisma.permisiune.findMany()
    for (const permisiune of toatePermisiunile) {
      await prisma.rolPermisiune.create({
        data: {
          rolId: '550e8400-e29b-41d4-a716-446655440001',
          permisiuneId: permisiune.id
        }
      })
    }

    // Administrator - majoritatea permisiunilor (fără sistem_configurare)
    const permisiuniAdmin = toatePermisiunile.filter(p => p.nume !== 'sistem_configurare')
    for (const permisiune of permisiuniAdmin) {
      await prisma.rolPermisiune.create({
        data: {
          rolId: '550e8400-e29b-41d4-a716-446655440002',
          permisiuneId: permisiune.id
        }
      })
    }

    // Operator Registratură
    const permisiuniOperator = [
      'documente_citire', 'documente_creare', 'documente_editare', 
      'documente_export', 'rapoarte_vizualizare', 'rapoarte_export'
    ]
    for (const numePermisiune of permisiuniOperator) {
      const permisiune = await prisma.permisiune.findUnique({
        where: { nume: numePermisiune }
      })
      if (permisiune) {
        await prisma.rolPermisiune.create({
          data: {
            rolId: '550e8400-e29b-41d4-a716-446655440003',
            permisiuneId: permisiune.id
          }
        })
      }
    }

    // Arhivist
    const permisiuniArhivist = [
      'documente_citire', 'documente_editare', 'documente_export', 
      'documente_arhivare', 'fonduri_gestionare', 'categorii_gestionare',
      'rapoarte_vizualizare', 'rapoarte_export'
    ]
    for (const numePermisiune of permisiuniArhivist) {
      const permisiune = await prisma.permisiune.findUnique({
        where: { nume: numePermisiune }
      })
      if (permisiune) {
        await prisma.rolPermisiune.create({
          data: {
            rolId: '550e8400-e29b-41d4-a716-446655440004',
            permisiuneId: permisiune.id
          }
        })
      }
    }

    // Cititor
    const permisiuniCititor = ['documente_citire', 'rapoarte_vizualizare']
    for (const numePermisiune of permisiuniCititor) {
      const permisiune = await prisma.permisiune.findUnique({
        where: { nume: numePermisiune }
      })
      if (permisiune) {
        await prisma.rolPermisiune.create({
          data: {
            rolId: '550e8400-e29b-41d4-a716-446655440005',
            permisiuneId: permisiune.id
          }
        })
      }
    }

    console.log('🔗 Relații rol-permisiuni create')

    // 7. Creează utilizatori de test
    const parolaHash = await bcrypt.hash('parola123', 10)

    // Super Admin
    const superAdmin = await prisma.utilizator.create({
      data: {
        id: '350e8400-e29b-41d4-a716-446655440001',
        email: 'admin@sector1.ro',
        parolaHash,
        nume: 'Popescu',
        prenume: 'Ion',
        functie: 'Administrator Sistem',
        telefon: '0721.555.001',
        primariaId: primariaTest.id,
        emailVerificat: true
      }
    })

    // Administrator Primărie
    const adminPrimarie = await prisma.utilizator.create({
      data: {
        id: '350e8400-e29b-41d4-a716-446655440002',
        email: 'manager@sector1.ro',
        parolaHash,
        nume: 'Ionescu',
        prenume: 'Maria',
        functie: 'Manager Primărie',
        telefon: '0721.555.002',
        primariaId: primariaTest.id,
        emailVerificat: true
      }
    })

    // Operator Registratură
    const operatorRegistratura = await prisma.utilizator.create({
      data: {
        id: '350e8400-e29b-41d4-a716-446655440003',
        email: 'operator@sector1.ro',
        parolaHash,
        nume: 'Georgescu',
        prenume: 'Ana',
        functie: 'Operator Registratură',
        telefon: '0721.555.003',
        primariaId: primariaTest.id,
        emailVerificat: true
      }
    })

    console.log('👤 Utilizatori de test creați')

    // 8. Atribuie roluri utilizatorilor
    await prisma.utilizatorRol.create({
      data: {
        utilizatorId: superAdmin.id,
        rolId: '550e8400-e29b-41d4-a716-446655440001' // Super Admin
      }
    })

    await prisma.utilizatorRol.create({
      data: {
        utilizatorId: adminPrimarie.id,
        rolId: '550e8400-e29b-41d4-a716-446655440002' // Administrator
      }
    })

    await prisma.utilizatorRol.create({
      data: {
        utilizatorId: operatorRegistratura.id,
        rolId: '550e8400-e29b-41d4-a716-446655440003' // Operator Registratură
      }
    })

    console.log('🔗 Roluri atribuite utilizatorilor')

    // 9. Creează categoriile de documente PRIMUL
    const categoriiDocumente = [
      {
        id: 'cat-hotarari-dispozitii',
        nume: 'Hotărâri și Dispoziții',
        cod: 'HOT-DISP',
        descriere: 'Hotărâri ale Consiliului Local și Dispoziții ale Primarului',
        perioadaRetentie: 50,
        active: true,
        confidentialitateDefaultId: confidentialitateDocs['public'].id
      },
      {
        id: 'cat-contracte-conventii',
        nume: 'Contracte și Convenții',
        cod: 'CONTR-CONV',
        descriere: 'Contracte de achiziții, prestări servicii și convenții',
        perioadaRetentie: 10,
        active: true,
        confidentialitateDefaultId: confidentialitateDocs['confidential'].id
      },
      {
        id: 'cat-corespondenta-cetateni',
        nume: 'Corespondența cu cetățenii',
        cod: 'COR-CET',
        descriere: 'Documente de corespondență cu cetățenii - cereri, sesizări, plângeri',
        perioadaRetentie: 5,
        active: true,
        confidentialitateDefaultId: confidentialitateDocs['public'].id
      },
      {
        id: 'cat-corespondenta-institutii',
        nume: 'Corespondența cu alte instituții',
        cod: 'COR-INST',
        descriere: 'Corespondența oficială cu alte instituții publice',
        perioadaRetentie: 10,
        active: true,
        confidentialitateDefaultId: confidentialitateDocs['public'].id
      },
      {
        id: 'cat-financiar-contabile',
        nume: 'Documente financiar-contabile',
        cod: 'FIN-CONT',
        descriere: 'Facturi, chitanțe, ordine de plată, situații financiare',
        perioadaRetentie: 10,
        active: true,
        confidentialitateDefaultId: confidentialitateDocs['confidential'].id
      },
      {
        id: 'cat-procese-verbale',
        nume: 'Procese verbale',
        cod: 'PV',
        descriere: 'Procese verbale diverse - ședințe, constatări, recepții',
        perioadaRetentie: 10,
        active: true,
        confidentialitateDefaultId: confidentialitateDocs['public'].id
      },
      {
        id: 'cat-arhiva-evidente',
        nume: 'Arhivă și Evidențe speciale',
        cod: 'ARHIVA',
        descriere: 'Documente pentru arhivare și evidențe speciale',
        perioadaRetentie: 100,
        active: true,
        confidentialitateDefaultId: confidentialitateDocs['public'].id
      }
    ];

    const categoriiCreate = {};
    for (const categorie of categoriiDocumente) {
      const categorieCreata = await prisma.categorieDocument.create({
        data: categorie
      });
      categoriiCreate[categorie.id] = categorieCreata;
    }
    console.log('📁 Categorii documente create')

    // 10. Creează departamentele
    const departamentAdministrativ = await prisma.departament.create({
      data: {
        nume: 'Administrativ',
        descriere: 'Departament Administrativ și Resurse Umane',
        cod: 'ADM',
        primariaId: primariaTest.id
      }
    })

    const departamentContabilitate = await prisma.departament.create({
      data: {
        nume: 'Contabilitate',
        descriere: 'Departament Contabilitate și Buget',
        cod: 'CONT',
        primariaId: primariaTest.id
      }
    })

    const departamentRelatiiPublic = await prisma.departament.create({
      data: {
        nume: 'Relații cu Publicul',
        descriere: 'Departament Relații cu Publicul și Comunicare',
        cod: 'REL',
        primariaId: primariaTest.id
      }
    })

    console.log('🏢 Departamente create')

    // 11. Creează registrele
    const registruDeciziePrimar = await prisma.registru.create({
      data: {
        nume: 'Decizie Primar',
        descriere: 'Registru pentru deciziile primarului',
        cod: 'DP',
        tipRegistru: 'iesire',
        departamentId: departamentAdministrativ.id
      }
    })

    const registruHotarariCL = await prisma.registru.create({
      data: {
        nume: 'Hotărâri Consiliu Local',
        descriere: 'Registru pentru hotărârile consiliului local',
        cod: 'HCL',
        tipRegistru: 'iesire',
        departamentId: departamentAdministrativ.id
      }
    })

    const registruContabilitate = await prisma.registru.create({
      data: {
        nume: 'Contabilitate',
        descriere: 'Registru pentru documentele de contabilitate',
        cod: 'CON',
        tipRegistru: 'intrare_iesire',
        departamentId: departamentContabilitate.id
      }
    })

    const registruCorespondentaCetateni = await prisma.registru.create({
      data: {
        nume: 'Corespondența cu Cetățenii',
        descriere: 'Registru pentru corespondența cu cetățenii',
        cod: 'COR',
        tipRegistru: 'intrare_iesire',
        departamentId: departamentRelatiiPublic.id
      }
    })

    console.log('📋 Registre create')

    // 12. Creează tipurile de documente CU CATEGORII ASOCIATE

    // Tipuri documente pentru Decizie Primar
    await prisma.tipDocument.create({
      data: {
        nume: 'Dispoziție Primar',
        descriere: 'Dispoziții emise de primar',
        cod: 'DISP',
        registruId: registruDeciziePrimar.id,
        categorieId: categoriiCreate['cat-hotarari-dispozitii'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Ordin Primar',
        descriere: 'Ordine emise de primar',
        cod: 'ORD',
        registruId: registruDeciziePrimar.id,
        categorieId: categoriiCreate['cat-hotarari-dispozitii'].id // ✅ Asociază categoria
      }
    })

    // Tipuri documente pentru Hotărâri Consiliu Local
    await prisma.tipDocument.create({
      data: {
        nume: 'Hotărâre Consiliu Local',
        descriere: 'Hotărâri ale consiliului local',
        cod: 'HCL',
        registruId: registruHotarariCL.id,
        categorieId: categoriiCreate['cat-hotarari-dispozitii'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Proces Verbal Ședință',
        descriere: 'Procese verbale ale ședințelor consiliului',
        cod: 'PVS',
        registruId: registruHotarariCL.id,
        categorieId: categoriiCreate['cat-procese-verbale'].id // ✅ Asociază categoria
      }
    })

    // Tipuri documente pentru Contabilitate
    await prisma.tipDocument.create({
      data: {
        nume: 'Factură',
        descriere: 'Facturi și documente de plată',
        cod: 'FACT',
        registruId: registruContabilitate.id,
        categorieId: categoriiCreate['cat-financiar-contabile'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Contract',
        descriere: 'Contracte și convenții',
        cod: 'CONTR',
        registruId: registruContabilitate.id,
        categorieId: categoriiCreate['cat-contracte-conventii'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Raport Financiar',
        descriere: 'Rapoarte și situații financiare',
        cod: 'RAF',
        registruId: registruContabilitate.id,
        categorieId: categoriiCreate['cat-financiar-contabile'].id // ✅ Asociază categoria
      }
    })

    // Tipuri documente pentru Corespondența cu Cetățenii
    await prisma.tipDocument.create({
      data: {
        nume: 'Sesizare',
        descriere: 'Sesizări din partea cetățenilor',
        cod: 'SES',
        registruId: registruCorespondentaCetateni.id,
        categorieId: categoriiCreate['cat-corespondenta-cetateni'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Cerere',
        descriere: 'Cereri din partea cetățenilor',
        cod: 'CER',
        registruId: registruCorespondentaCetateni.id,
        categorieId: categoriiCreate['cat-corespondenta-cetateni'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Plângere',
        descriere: 'Plângeri din partea cetățenilor',
        cod: 'PLA',
        registruId: registruCorespondentaCetateni.id,
        categorieId: categoriiCreate['cat-corespondenta-cetateni'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Comunicat',
        descriere: 'Comunicate către cetățeni',
        cod: 'COM',
        registruId: registruCorespondentaCetateni.id,
        categorieId: categoriiCreate['cat-corespondenta-institutii'].id // ✅ Asociază categoria
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Răspuns',
        descriere: 'Răspunsuri la solicitările cetățenilor',
        cod: 'RASP',
        registruId: registruCorespondentaCetateni.id,
        categorieId: categoriiCreate['cat-corespondenta-cetateni'].id // ✅ Asociază categoria
      }
    })

    console.log('📝 Tipuri documente create cu categorii asociate')

    console.log('\n✅ Seed complet cu succes!')
    console.log('\n📋 Utilizatori de test creați:')
    console.log('1. Super Admin: admin@sector1.ro / parola123')
    console.log('2. Administrator: manager@sector1.ro / parola123')
    console.log('3. Operator: operator@sector1.ro / parola123')
    console.log('\n🏢 Departamente create:')
    console.log('1. Administrativ (ADM)')
    console.log('2. Contabilitate (CONT)')
    console.log('3. Relații cu Publicul (REL)')
    console.log('\n📋 Registre create cu tipuri de documente:')
    console.log('1. Decizie Primar: Dispoziție Primar, Ordin Primar')
    console.log('2. Hotărâri Consiliu Local: Hotărâre CL, Proces Verbal Ședință')
    console.log('3. Contabilitate: Factură, Contract, Raport Financiar')
    console.log('4. Corespondența cu Cetățenii: Sesizare, Cerere, Plângere, Comunicat, Răspuns')
    console.log('\n📁 Categorii de documente create:')
    console.log('1. Hotărâri și Dispoziții (50 ani)')
    console.log('2. Contracte și Convenții (10 ani)')
    console.log('3. Corespondența cu cetățenii (5 ani)')
    console.log('4. Corespondența cu alte instituții (10 ani)')
    console.log('5. Documente financiar-contabile (10 ani)')
    console.log('6. Procese verbale (10 ani)')
    console.log('7. Arhivă și Evidențe speciale (100 ani)')
    console.log('\n🔗 Relații tip document - categorie create corect!')
    
  } catch (error) {
    console.error('❌ Eroare în timpul seed-ului:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })