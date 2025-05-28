# Context: Aplicație E-Registratură pentru Primăriile din România

## Descriere Generală

Aplicația e-registratură este un sistem complex de management documente pentru primăriile din România, dezvoltat în conformitate cu Legea nr. 201/2024 și Ghidul Digitalizării emis de Arhivele Naționale. Sistemul utilizează tehnologii moderne și inteligență artificială pentru automatizarea proceselor administrative și îndeplinirea cerințelor legale stricte.

## Stack Tehnologic

### Frontend
- **Next.js 14** - Framework React cu App Router (JavaScript)
- **Shadcn/ui** - Componente UI moderne și accesibile
- **Tailwind CSS** - Styling și design responsive
- **JavaScript ES6+** - Dezvoltare modernă cu JSDoc pentru documentație

### State Management & API
- **Zustand** - State management global simplificat
- **TanStack Query (React Query)** - Cache management și sincronizare server
- **Axios** - HTTP client pentru API calls

### Backend & Deployment
- **API Routes Next.js** - Backend integrat (JavaScript)
- **Prisma ORM** - Database management și migrations
- **PostgreSQL** - Baza de date (Docker container)
- **Docker & Docker Compose** - Containerizare aplicație
- **n8n** - Automatizări și workflow-uri (container separat)
- **OpenAI API** - Funcționalități AI integrate

### Setup Development & Production
- **Node.js 18+** - Runtime environment
- **Docker & Docker Compose** - Containerizare și orchestrare
- **Volume Mapping** - Pentru stocare externă pe disk
- **nginx/Caddy** - Reverse proxy pentru producție

## Cerințe Legale și Tehnice (Legea 201/2024)

### 1. Cerințe Fundamentale de Export și Management

#### Export Conform Sistemului de Management Arhivistic
- Export date conform standardelor Arhivelor Naționale
- Formaturi suportate: PDF, XLS, CSV
- Metadate conforme cu standardele arhivistice românești
- Integritate și autenticitate documentelor electronice

#### Gestionare Multiple Fonduri de Arhivă
- Crearea și administrarea mai multor fonduri de arhivă
- Definirea multiplelor diagrame de organizare per fond
- Clasificare documentară conform legislației arhivistice

### 2. Funcționalități Obligatorii

#### Caracteristici Organizaționale
```javascript
// JSDoc pentru documentarea interfețelor
/**
 * @typedef {Object} FondArhiva
 * @property {string} id - ID unic al fondului
 * @property {string} nume - Numele fondului de arhivă
 * @property {string} cod - Codul fondului
 * @property {DiagramaOrganizare[]} diagrameOrganizare - Lista diagramelor
 * @property {CategorieDocument[]} categoriiDocumente - Categoriile de documente
 * @property {Object} metadate - Metadatele arhivistice
 */

/**
 * @typedef {Object} DiagramaOrganizare
 * @property {string} id - ID unic al diagramei
 * @property {string} nume - Numele diagramei
 * @property {Object} structura - Structura organizatorică
 * @property {PerioadaRetentie[]} perioadeRetentie - Perioadele de retenție
 */
```

#### Caracteristici de Raportare
- Generare rapoarte electronice automatizate
- Export în formate multiple (PDF, XLS, CSV)
- Statistici și analytics în timp real
- Dashboards administrative

#### Caracteristici de Identificare
- Generare automată etichete cu coduri de bare
- Numere de înregistrare unice
- Suport pentru imprimante specializate
- QR codes pentru tracking digital

### 3. Cerințe Procedurale Detaliate

#### VALIDATE - Validarea Automată și de Către Operator
```javascript
/**
 * @typedef {Object} ValidareDocument
 * @property {Object} validareAutomata - Validarea automată
 * @property {boolean} validareAutomata.verificareFormat - Verificare format
 * @property {boolean} validareAutomata.verificareMetadate - Verificare metadate
 * @property {boolean} validareAutomata.verificareIntegritate - Verificare integritate
 * @property {boolean} validareAutomata.verificareConformitate - Verificare conformitate
 * @property {Object} validareOperator - Validarea operatorului
 * @property {boolean} validareOperator.aprobat - Status aprobat
 * @property {string} validareOperator.observatii - Observații operator
 * @property {Date} validareOperator.dataValidare - Data validării
 * @property {string} validareOperator.operatorId - ID operator
 */
```

#### DELIVER - Transmiterea Datelor
- Furnizarea datelor digitale către utilizatori
- Integrare cu sisteme ERP existente
- API-uri pentru sisteme terțe
- Notificări și alerte automate

#### Catalogare Documentară
- Respectarea legislației Arhivelor Naționale
- Categorii de documente standardizate
- Metadate obligatorii și opționale
- Indexare și căutare avansată

### 4. Aspecte de Securitate Informatică

#### Control Acces
```javascript
/**
 * @typedef {Object} ControlAcces
 * @property {Object} autentificare - Configurări autentificare
 * @property {string[]} autentificare.tipuri - ['password', 'mfa', 'certificat_digital']
 * @property {Object} autentificare.politiciParole - Politici pentru parole
 * @property {Object} autentificare.sesiuni - Gestionarea sesiunilor
 * @property {Object} autorizare - Configurări autorizare
 * @property {Rol[]} autorizare.roluri - Lista rolurilor
 * @property {Permisiune[]} autorizare.permisiuni - Lista permisiunilor
 * @property {Object} autorizare.nivelAcces - Nivelurile de acces
 */

/**
 * @typedef {Object} Rol
 * @property {string} id - ID unic al rolului
 * @property {string} nume - Numele rolului
 * @property {string} descriere - Descrierea rolului
 * @property {number} nivelAcces - Nivelul de acces (1-4)
 * @property {boolean} activ - Status activ
 * @property {boolean} sistem - Rol de sistem (nu se poate șterge)
 * @property {Permisiune[]} permisiuni - Lista permisiunilor
 */

/**
 * @typedef {Object} Permisiune
 * @property {string} id - ID unic al permisiunii
 * @property {string} nume - Numele permisiunii
 * @property {string} descriere - Descrierea permisiunii
 * @property {string} modul - Modulul aplicației ('documente', 'utilizatori', etc.)
 * @property {string} actiune - Acțiunea permisă ('citire', 'scriere', etc.)
 */

/**
 * Sistem de roluri predefinite:
 * 1. Cititor (nivel 1) - doar citire documente și rapoarte
 * 2. Operator Registratură (nivel 2) - creare, editare documente, export
 * 3. Arhivist (nivel 2) - gestionare arhivă, categorii, export
 * 4. Administrator (nivel 3) - gestionare utilizatori, majoritatea funcțiilor
 * 5. Super Admin (nivel 4) - acces complet, configurare sistem
 */
```

#### Audit și Monitoring
- Urmărirea și înregistrarea tuturor modificărilor
- Păstrarea istoricului complet al documentelor
- Logs de securitate și acces
- Rapoarte de audit automatizate

#### Protecția Datelor (GDPR)
- Anonimizare și pseudonimizare
- Dreptul la ștergere și portabilitate
- Consimțământ explicit pentru procesare
- Notificări breach-uri de securitate

## Arhitectura Sistemului

### Structura Bazei de Date

#### Entități Principale
```sql
-- Primarii și Utilizatori
CREATE TABLE primarii (
    id UUID PRIMARY KEY,
    nume VARCHAR(255) NOT NULL,
    cod_siruta VARCHAR(10) UNIQUE,
    judet VARCHAR(100),
    localitate VARCHAR(255),
    adresa TEXT,
    contact_info JSONB,
    configurari JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE utilizatori (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    parola_hash VARCHAR(255) NOT NULL,
    nume VARCHAR(255) NOT NULL,
    prenume VARCHAR(255) NOT NULL,
    functie VARCHAR(255),
    telefon VARCHAR(20),
    primaria_id UUID REFERENCES primarii(id),
    activ BOOLEAN DEFAULT true,
    email_verificat BOOLEAN DEFAULT false,
    ultima_logare TIMESTAMP,
    token_resetare VARCHAR(255),
    token_resetare_expira TIMESTAMP,
    preferinte JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fonduri și Organizare Arhivistică
CREATE TABLE fonduri_arhiva (
    id UUID PRIMARY KEY,
    primaria_id UUID REFERENCES primarii(id),
    nume VARCHAR(255) NOT NULL,
    cod VARCHAR(50) UNIQUE NOT NULL,
    descriere TEXT,
    perioada_acoperire DATERANGE,
    status ENUM('activ', 'inactiv', 'arhivat'),
    metadate_arhivistice JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE diagrame_organizare (
    id UUID PRIMARY KEY,
    fond_arhiva_id UUID REFERENCES fonduri_arhiva(id),
    nume VARCHAR(255) NOT NULL,
    versiune INTEGER DEFAULT 1,
    structura JSONB NOT NULL,
    perioada_valabilitate DATERANGE,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documente și Registratură
-- Departamente și Registre pentru organizarea documentelor
CREATE TABLE departamente (
    id UUID PRIMARY KEY,
    primaria_id UUID REFERENCES primarii(id),
    nume VARCHAR(255) NOT NULL,
    cod VARCHAR(50) NOT NULL,
    descriere TEXT,
    responsabil_id UUID REFERENCES utilizatori(id),
    activ BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(primaria_id, cod)
);

CREATE TABLE registre (
    id UUID PRIMARY KEY,
    departament_id UUID REFERENCES departamente(id),
    nume VARCHAR(255) NOT NULL,
    cod VARCHAR(50) NOT NULL,
    descriere TEXT,
    tip_registru ENUM('intrare', 'iesire', 'intern', 'intrare-iesire'),
    activ BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(departament_id, cod)
);

CREATE TABLE documente (
    id UUID PRIMARY KEY,
    primaria_id UUID REFERENCES primarii(id),
    departament_id UUID REFERENCES departamente(id),
    registru_id UUID REFERENCES registre(id),
    fond_arhiva_id UUID REFERENCES fonduri_arhiva(id),
    numar_inregistrare VARCHAR(100) NOT NULL,
    data_inregistrare DATE NOT NULL,
    expeditor VARCHAR(500),
    destinatar VARCHAR(500),
    subiect TEXT NOT NULL,
    categorie_id UUID REFERENCES categorii_documente(id),
    tip_document ENUM('intrare', 'iesire', 'intern', 'intrare-iesire'),
    confidentialitate ENUM('public', 'confidential', 'secret'),
    prioritate ENUM('normala', 'urgenta', 'foarte_urgenta'),
    status ENUM('inregistrat', 'in_lucru', 'finalizat', 'arhivat'),
    termene JSONB,
    observatii TEXT,
    cod_bare VARCHAR(100) UNIQUE,
    qr_code VARCHAR(255),
    metadate JSONB,
    cale_document VARCHAR(500), -- calea conform structurii an/departament/registru/document
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(primaria_id, numar_inregistrare, EXTRACT(YEAR FROM data_inregistrare))
);

CREATE TABLE categorii_documente (
    id UUID PRIMARY KEY,
    nume VARCHAR(255) NOT NULL,
    cod VARCHAR(50) NOT NULL,
    descriere TEXT,
    perioada_retentie INTEGER, -- în ani
    confidentialitate_default ENUM('public', 'confidential', 'secret'),
    metadate_obligatorii JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fișiere și Anexe (Stocare externă pe disk prin volume mapping)
CREATE TABLE fisiere (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documente(id),
    nume_original VARCHAR(500) NOT NULL,
    nume_fisier_disk VARCHAR(500) NOT NULL, -- nume unic generat pentru disk
    extensie VARCHAR(10),
    marime BIGINT,
    tip_mime VARCHAR(100),
    hash_fisier VARCHAR(64), -- pentru verificarea integrității
    cale_relativa TEXT NOT NULL, -- calea relativă în storage extern: {year}\{departament_cod}\{registru_cod}\{numar_document}-{filename}.{extension}
    scanat BOOLEAN DEFAULT false,
    ocr_procesat BOOLEAN DEFAULT false,
    continut_text TEXT, -- rezultatul OCR
    miniatura_path VARCHAR(500), -- cale către miniatura generată
    metadate JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roluri și Permisiuni
CREATE TABLE roluri (
    id UUID PRIMARY KEY,
    nume VARCHAR(100) UNIQUE NOT NULL,
    descriere TEXT,
    nivel_acces INTEGER NOT NULL DEFAULT 1, -- 1=cititor, 2=operator, 3=admin, 4=super_admin
    activ BOOLEAN DEFAULT true,
    sistem BOOLEAN DEFAULT false, -- roluri de sistem (nu se pot șterge)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permisiuni (
    id UUID PRIMARY KEY,
    nume VARCHAR(100) UNIQUE NOT NULL,
    descriere TEXT,
    modul VARCHAR(50) NOT NULL, -- ex: 'documente', 'utilizatori', 'rapoarte'
    actiune VARCHAR(50) NOT NULL, -- ex: 'citire', 'scriere', 'stergere', 'export'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rol_permisiuni (
    id UUID PRIMARY KEY,
    rol_id UUID REFERENCES roluri(id) ON DELETE CASCADE,
    permisiune_id UUID REFERENCES permisiuni(id) ON DELETE CASCADE,
    UNIQUE(rol_id, permisiune_id)
);

CREATE TABLE utilizator_roluri (
    id UUID PRIMARY KEY,
    utilizator_id UUID REFERENCES utilizatori(id) ON DELETE CASCADE,
    rol_id UUID REFERENCES roluri(id) ON DELETE CASCADE,
    acordat_de UUID REFERENCES utilizatori(id),
    acordat_la TIMESTAMP DEFAULT NOW(),
    activ BOOLEAN DEFAULT true,
    UNIQUE(utilizator_id, rol_id)
);



-- Audit și Istoric
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    utilizator_id UUID REFERENCES utilizatori(id),
    document_id UUID REFERENCES documente(id),
    actiune VARCHAR(100) NOT NULL,
    detalii JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE istoric_documente (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documente(id),
    versiune INTEGER NOT NULL,
    modificari JSONB NOT NULL,
    modificat_de UUID REFERENCES utilizatori(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Procesări (rezultatele se salvează în fișiere, nu în baza de date)
CREATE TABLE ai_procesari (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documente(id),
    tip_procesare ENUM('ocr', 'clasificare', 'extractie_entitati', 'rezumat'),
    status ENUM('pending', 'processing', 'completed', 'failed'),
    cale_rezultat VARCHAR(500), -- calea către fișierul cu rezultatul AI
    confidenta DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Indexuri pentru performanță
CREATE INDEX idx_documente_data_inregistrare ON documente(data_inregistrare);
CREATE INDEX idx_documente_numar_inregistrare ON documente(numar_inregistrare);
CREATE INDEX idx_documente_expeditor ON documente(expeditor);
CREATE INDEX idx_documente_subiect ON documente USING gin(to_tsvector('romanian', subiect));
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_fisiere_document_id ON fisiere(document_id);
CREATE INDEX idx_fisiere_hash ON fisiere(hash_fisier);
CREATE INDEX idx_utilizator_roluri_utilizator ON utilizator_roluri(utilizator_id);
CREATE INDEX idx_utilizator_roluri_activ ON utilizator_roluri(activ);
CREATE INDEX idx_rol_permisiuni_rol ON rol_permisiuni(rol_id);

-- Date inițiale pentru roluri și permisiuni
INSERT INTO roluri (id, nume, descriere, nivel_acces, sistem) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Super Admin', 'Acces complet la sistem', 4, true),
('550e8400-e29b-41d4-a716-446655440002', 'Administrator', 'Administrator primărie', 3, true),
('550e8400-e29b-41d4-a716-446655440003', 'Operator Registratură', 'Operator pentru înregistrarea documentelor', 2, true),
('550e8400-e29b-41d4-a716-446655440004', 'Arhivist', 'Responsabil cu arhivarea documentelor', 2, true),
('550e8400-e29b-41d4-a716-446655440005', 'Cititor', 'Doar citirea documentelor', 1, true);

INSERT INTO permisiuni (id, nume, descriere, modul, actiune) VALUES
-- Permisiuni documente
('650e8400-e29b-41d4-a716-446655440001', 'documente_citire', 'Citirea documentelor', 'documente', 'citire'),
('650e8400-e29b-41d4-a716-446655440002', 'documente_creare', 'Crearea documentelor noi', 'documente', 'creare'),
('650e8400-e29b-41d4-a716-446655440003', 'documente_editare', 'Editarea documentelor existente', 'documente', 'editare'),
('650e8400-e29b-41d4-a716-446655440004', 'documente_stergere', 'Ștergerea documentelor', 'documente', 'stergere'),
('650e8400-e29b-41d4-a716-446655440005', 'documente_export', 'Export documente', 'documente', 'export'),
('650e8400-e29b-41d4-a716-446655440006', 'documente_arhivare', 'Arhivarea documentelor', 'documente', 'arhivare'),
-- Permisiuni utilizatori
('650e8400-e29b-41d4-a716-446655440007', 'utilizatori_citire', 'Vizualizarea utilizatorilor', 'utilizatori', 'citire'),
('650e8400-e29b-41d4-a716-446655440008', 'utilizatori_creare', 'Crearea utilizatorilor', 'utilizatori', 'creare'),
('650e8400-e29b-41d4-a716-446655440009', 'utilizatori_editare', 'Editarea utilizatorilor', 'utilizatori', 'editare'),
('650e8400-e29b-41d4-a716-446655440010', 'utilizatori_stergere', 'Ștergerea utilizatorilor', 'utilizatori', 'stergere'),
-- Permisiuni rapoarte
('650e8400-e29b-41d4-a716-446655440011', 'rapoarte_vizualizare', 'Vizualizarea rapoartelor', 'rapoarte', 'vizualizare'),
('650e8400-e29b-41d4-a716-446655440012', 'rapoarte_export', 'Export rapoarte', 'rapoarte', 'export'),
('650e8400-e29b-41d4-a716-446655440013', 'rapoarte_avansate', 'Rapoarte avansate și statistici', 'rapoarte', 'avansate'),
-- Permisiuni sistem
('650e8400-e29b-41d4-a716-446655440014', 'sistem_configurare', 'Configurarea sistemului', 'sistem', 'configurare'),
('650e8400-e29b-41d4-a716-446655440015', 'sistem_backup', 'Gestionarea backup-urilor', 'sistem', 'backup'),
('650e8400-e29b-41d4-a716-446655440016', 'sistem_audit', 'Accesul la logurile de audit', 'sistem', 'audit'),
-- Permisiuni fonduri arhivă
('650e8400-e29b-41d4-a716-446655440017', 'fonduri_gestionare', 'Gestionarea fondurilor de arhivă', 'fonduri', 'gestionare'),
('650e8400-e29b-41d4-a716-446655440018', 'categorii_gestionare', 'Gestionarea categoriilor de documente', 'categorii', 'gestionare');

-- Atribuirea permisiunilor la roluri
-- Super Admin - toate permisiunile
INSERT INTO rol_permisiuni (id, rol_id, permisiune_id)
SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', id FROM permisiuni;

-- Administrator - majoritatea permisiunilor (fără sistem_configurare)
INSERT INTO rol_permisiuni (id, rol_id, permisiune_id)
SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', id 
FROM permisiuni 
WHERE nume != 'sistem_configurare';

-- Operator Registratură
INSERT INTO rol_permisiuni (id, rol_id, permisiune_id) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001'), -- documente_citire
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002'), -- documente_creare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003'), -- documente_editare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440005'), -- documente_export
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440011'), -- rapoarte_vizualizare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440012'); -- rapoarte_export

-- Arhivist
INSERT INTO rol_permisiuni (id, rol_id, permisiune_id) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001'), -- documente_citire
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003'), -- documente_editare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440005'), -- documente_export
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440006'), -- documente_arhivare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440017'), -- fonduri_gestionare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440018'), -- categorii_gestionare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440011'), -- rapoarte_vizualizare
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440012'); -- rapoarte_export

-- Cititor - doar citire
INSERT INTO rol_permisiuni (id, rol_id, permisiune_id) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001'), -- documente_citire
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440011'); -- rapoarte_vizualizare
```

