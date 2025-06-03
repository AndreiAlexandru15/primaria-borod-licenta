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
    console.log('📁 Categorii documente create')    // 10. Creează departamentele conform structurii reale Primăria Borod
    const departamentAdministratie = await prisma.departament.create({
      data: {
        nume: 'Activitate administrație publică',
        descriere: 'Departament pentru administrația publică locală și managementul general',
        cod: 'AAP',
        primariaId: primariaTest.id
      }
    })

    const departamentStareCivila = await prisma.departament.create({
      data: {
        nume: 'Activitate stare civilă',
        descriere: 'Departament pentru actele de stare civilă - născut, căsătorie, deces',
        cod: 'ASC',
        primariaId: primariaTest.id
      }
    })

    const departamentAgricol = await prisma.departament.create({
      data: {
        nume: 'Agricol',
        descriere: 'Departament pentru problemele agricole și dezvoltarea rurală',
        cod: 'AGR',
        primariaId: primariaTest.id
      }
    })

    const departamentUrbanism = await prisma.departament.create({
      data: {
        nume: 'Urbanism-Achiziții Publice',
        descriere: 'Departament pentru urbanism, autorizații de construire și achiziții publice',
        cod: 'UAP',
        primariaId: primariaTest.id
      }
    })

    const departamentFinanciar = await prisma.departament.create({
      data: {
        nume: 'Financiar-Contabil',
        descriere: 'Departament pentru contabilitate, buget și gestiunea financiară',
        cod: 'FC',
        primariaId: primariaTest.id
      }
    })

    console.log('🏢 Departamente Primăria Borod create')    // 11. Creează registrele conform departamentelor Primăria Borod
    const registruAdministratie = await prisma.registru.create({
      data: {
        nume: 'Registru Administrație Publică',
        descriere: 'Registru pentru documentele de administrație publică',
        cod: 'RAP',
        tipRegistru: 'intrare_iesire',
        departamentId: departamentAdministratie.id
      }
    })

    const registruStareCivila = await prisma.registru.create({
      data: {
        nume: 'Registru Stare Civilă',
        descriere: 'Registru pentru actele de stare civilă',
        cod: 'RSC',
        tipRegistru: 'intrare_iesire',
        departamentId: departamentStareCivila.id
      }
    })

    const registruAgricol = await prisma.registru.create({
      data: {
        nume: 'Registru Agricol',
        descriere: 'Registru pentru documentele agricole și dezvoltare rurală',
        cod: 'RAG',
        tipRegistru: 'intrare_iesire',
        departamentId: departamentAgricol.id
      }
    })

    const registruUrbanism = await prisma.registru.create({
      data: {
        nume: 'Registru Urbanism și Achiziții',
        descriere: 'Registru pentru autorizații urbanism și achiziții publice',
        cod: 'RUA',
        tipRegistru: 'intrare_iesire',
        departamentId: departamentUrbanism.id
      }
    })

    const registruFinanciar = await prisma.registru.create({
      data: {
        nume: 'Registru Financiar-Contabil',
        descriere: 'Registru pentru documentele financiar-contabile',
        cod: 'RFC',
        tipRegistru: 'intrare_iesire',
        departamentId: departamentFinanciar.id
      }
    })

    console.log('📋 Registre Primăria Borod create')    // 12. Creează tipurile de documente pentru departamentele Primăria Borod

    // Tipuri documente pentru Administrație Publică
    await prisma.tipDocument.create({
      data: {
        nume: 'Dispoziție Primar',
        descriere: 'Dispoziții emise de primar',
        cod: 'DISP',
        registruId: registruAdministratie.id,
        categorieId: categoriiCreate['cat-hotarari-dispozitii'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Hotărâre Consiliu Local',
        descriere: 'Hotărâri ale consiliului local',
        cod: 'HCL',
        registruId: registruAdministratie.id,
        categorieId: categoriiCreate['cat-hotarari-dispozitii'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Proces Verbal Ședință',
        descriere: 'Procese verbale ale ședințelor consiliului',
        cod: 'PVS',
        registruId: registruAdministratie.id,
        categorieId: categoriiCreate['cat-procese-verbale'].id
      }
    })

    // Tipuri documente pentru Stare Civilă
    await prisma.tipDocument.create({
      data: {
        nume: 'Certificat Naștere',
        descriere: 'Certificate de naștere',
        cod: 'CN',
        registruId: registruStareCivila.id,
        categorieId: categoriiCreate['cat-arhiva-evidente'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Certificat Căsătorie',
        descriere: 'Certificate de căsătorie',
        cod: 'CC',
        registruId: registruStareCivila.id,
        categorieId: categoriiCreate['cat-arhiva-evidente'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Certificat Deces',
        descriere: 'Certificate de deces',
        cod: 'CD',
        registruId: registruStareCivila.id,
        categorieId: categoriiCreate['cat-arhiva-evidente'].id
      }
    })

    // Tipuri documente pentru Agricol
    await prisma.tipDocument.create({
      data: {
        nume: 'Cerere Subvenție Agricolă',
        descriere: 'Cereri pentru subvenții agricole',
        cod: 'CSA',
        registruId: registruAgricol.id,
        categorieId: categoriiCreate['cat-corespondenta-cetateni'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Autorizație Agricolă',
        descriere: 'Autorizații pentru activități agricole',
        cod: 'AA',
        registruId: registruAgricol.id,
        categorieId: categoriiCreate['cat-arhiva-evidente'].id
      }
    })

    // Tipuri documente pentru Urbanism-Achiziții
    await prisma.tipDocument.create({
      data: {
        nume: 'Autorizație Construire',
        descriere: 'Autorizații de construire',
        cod: 'AC',
        registruId: registruUrbanism.id,
        categorieId: categoriiCreate['cat-arhiva-evidente'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Contract Achiziție Publică',
        descriere: 'Contracte pentru achiziții publice',
        cod: 'CAP',
        registruId: registruUrbanism.id,
        categorieId: categoriiCreate['cat-contracte-conventii'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Certificat Urbanism',
        descriere: 'Certificate de urbanism',
        cod: 'CU',
        registruId: registruUrbanism.id,
        categorieId: categoriiCreate['cat-arhiva-evidente'].id
      }
    })

    // Tipuri documente pentru Financiar-Contabil
    await prisma.tipDocument.create({
      data: {
        nume: 'Factură',
        descriere: 'Facturi și documente de plată',
        cod: 'FACT',
        registruId: registruFinanciar.id,
        categorieId: categoriiCreate['cat-financiar-contabile'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Ordin de Plată',
        descriere: 'Ordine de plată',
        cod: 'OP',
        registruId: registruFinanciar.id,
        categorieId: categoriiCreate['cat-financiar-contabile'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Situație Financiară',
        descriere: 'Situații financiare și rapoarte contabile',
        cod: 'SF',
        registruId: registruFinanciar.id,
        categorieId: categoriiCreate['cat-financiar-contabile'].id
      }
    })

    await prisma.tipDocument.create({
      data: {
        nume: 'Buget Local',
        descriere: 'Documente privind bugetul local',
        cod: 'BL',
        registruId: registruFinanciar.id,
        categorieId: categoriiCreate['cat-financiar-contabile'].id
      }
    })

    console.log('📝 Tipuri documente pentru Primăria Borod create cu categorii asociate')

    console.log('\n✅ Seed complet cu succes pentru Primăria Borod!')
    console.log('\n📋 Utilizatori de test creați:')
    console.log('1. Super Admin: admin@sector1.ro / parola123')
    console.log('2. Administrator: manager@sector1.ro / parola123')
    console.log('3. Operator: operator@sector1.ro / parola123')
    console.log('\n🏢 Departamente Primăria Borod create:')
    console.log('1. Activitate administrație publică (AAP)')
    console.log('2. Activitate stare civilă (ASC)')
    console.log('3. Agricol (AGR)')
    console.log('4. Urbanism-Achiziții Publice (UAP)')
    console.log('5. Financiar-Contabil (FC)')
    console.log('\n📋 Registre create pentru fiecare departament:')
    console.log('1. Administrație: Dispoziții Primar, Hotărâri CL, Procese Verbale')
    console.log('2. Stare Civilă: Certificate Naștere, Căsătorie, Deces')
    console.log('3. Agricol: Cereri Subvenții, Autorizații Agricole')
    console.log('4. Urbanism: Autorizații Construire, Contracte Achiziții, Certificate Urbanism')
    console.log('5. Financiar: Facturi, Ordine Plată, Situații Financiare, Buget Local')
    console.log('\n📁 Categorii de documente create:')
    console.log('1. Hotărâri și Dispoziții (50 ani)')
    console.log('2. Contracte și Convenții (10 ani)')
    console.log('3. Corespondența cu cetățenii (5 ani)')
    console.log('4. Corespondența cu alte instituții (10 ani)')
    console.log('5. Documente financiar-contabile (10 ani)')
    console.log('6. Procese verbale (10 ani)')
    console.log('7. Arhivă și Evidențe speciale (100 ani)')
    console.log('\n🔗 Relații tip document - categorie create corect pentru Primăria Borod!')
    
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