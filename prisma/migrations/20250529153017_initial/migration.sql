-- CreateEnum
CREATE TYPE "StatusFond" AS ENUM ('activ', 'inactiv', 'arhivat');

-- CreateEnum
CREATE TYPE "TipRegistru" AS ENUM ('intrare', 'iesire', 'intern', 'intrare_iesire');

-- CreateEnum
CREATE TYPE "Confidentialitate" AS ENUM ('public', 'confidential', 'secret');

-- CreateEnum
CREATE TYPE "Prioritate" AS ENUM ('normala', 'urgenta', 'foarte_urgenta');

-- CreateEnum
CREATE TYPE "TipProcesareAI" AS ENUM ('ocr', 'clasificare', 'extractie_entitati', 'rezumat');

-- CreateEnum
CREATE TYPE "StatusProcesareAI" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "StatusInregistrare" AS ENUM ('activa', 'finalizata', 'anulata');

-- CreateTable
CREATE TABLE "primarii" (
    "id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "cod_siruta" TEXT,
    "judet" TEXT,
    "localitate" TEXT,
    "adresa" TEXT,
    "contact_info" JSONB,
    "configurari" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "primarii_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizatori" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "parola_hash" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "prenume" TEXT NOT NULL,
    "functie" TEXT,
    "telefon" TEXT,
    "primaria_id" TEXT NOT NULL,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "email_verificat" BOOLEAN NOT NULL DEFAULT false,
    "ultima_logare" TIMESTAMP(3),
    "token_resetare" TEXT,
    "token_resetare_expira" TIMESTAMP(3),
    "preferinte" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilizatori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizator_departamente" (
    "id" TEXT NOT NULL,
    "utilizator_id" TEXT NOT NULL,
    "departament_id" TEXT NOT NULL,
    "rol_departament" TEXT,
    "data_atribuire" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilizator_departamente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fonduri_arhiva" (
    "id" TEXT NOT NULL,
    "primaria_id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "descriere" TEXT,
    "perioada_acoperire" TEXT,
    "status" "StatusFond" NOT NULL DEFAULT 'activ',
    "metadate_arhivistice" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fonduri_arhiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagrame_organizare" (
    "id" TEXT NOT NULL,
    "fond_arhiva_id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "versiune" INTEGER NOT NULL DEFAULT 1,
    "structura" JSONB NOT NULL,
    "perioada_valabilitate" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagrame_organizare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamente" (
    "id" TEXT NOT NULL,
    "primaria_id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "descriere" TEXT,
    "responsabil_id" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registre" (
    "id" TEXT NOT NULL,
    "departament_id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "descriere" TEXT,
    "tip_registru" "TipRegistru" NOT NULL,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inregistrari" (
    "id" TEXT NOT NULL,
    "registru_id" TEXT NOT NULL,
    "numar_inregistrare" TEXT NOT NULL,
    "data_inregistrare" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expeditor" TEXT,
    "destinatar" TEXT,
    "obiect" TEXT NOT NULL,
    "observatii" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusInregistrare" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inregistrari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorii_documente" (
    "id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "descriere" TEXT,
    "perioada_retentie" INTEGER,
    "confidentialitate_default" "Confidentialitate",
    "metadate_obligatorii" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorii_documente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fisiere" (
    "id" TEXT NOT NULL,
    "inregistrare_id" TEXT,
    "categorie_id" TEXT,
    "nume_original" TEXT NOT NULL,
    "nume_fisier_disk" TEXT NOT NULL,
    "extensie" TEXT,
    "marime" BIGINT,
    "tip_mime" TEXT,
    "hash_fisier" TEXT,
    "cale_relativa" TEXT NOT NULL,
    "scanat" BOOLEAN NOT NULL DEFAULT false,
    "ocr_procesat" BOOLEAN NOT NULL DEFAULT false,
    "continut_text" TEXT,
    "miniatura_path" TEXT,
    "subiect" TEXT,
    "data_fisier" DATE,
    "confidentialitate" "Confidentialitate" NOT NULL DEFAULT 'public',
    "prioritate" "Prioritate" NOT NULL DEFAULT 'normala',
    "termene" JSONB,
    "cod_bare" TEXT,
    "qr_code" TEXT,
    "metadate" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fisiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roluri" (
    "id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "descriere" TEXT,
    "nivel_acces" INTEGER NOT NULL DEFAULT 1,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "sistem" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roluri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisiuni" (
    "id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "descriere" TEXT,
    "modul" TEXT NOT NULL,
    "actiune" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisiuni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisiuni" (
    "id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "permisiune_id" TEXT NOT NULL,

    CONSTRAINT "rol_permisiuni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizator_roluri" (
    "id" TEXT NOT NULL,
    "utilizator_id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "acordat_de" TEXT,
    "acordat_la" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activ" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "utilizator_roluri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "utilizator_id" TEXT,
    "fisier_id" TEXT,
    "inregistrare_id" TEXT,
    "actiune" TEXT NOT NULL,
    "detalii" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "istoric_fisiere" (
    "id" TEXT NOT NULL,
    "fisier_id" TEXT NOT NULL,
    "versiune" INTEGER NOT NULL,
    "modificari" JSONB NOT NULL,
    "modificat_de" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "istoric_fisiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_procesari" (
    "id" TEXT NOT NULL,
    "fisier_id" TEXT NOT NULL,
    "tip_procesare" "TipProcesareAI" NOT NULL,
    "status" "StatusProcesareAI" NOT NULL DEFAULT 'pending',
    "cale_rezultat" TEXT,
    "confidenta" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_procesari_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "primarii_cod_siruta_key" ON "primarii"("cod_siruta");

-- CreateIndex
CREATE UNIQUE INDEX "utilizatori_email_key" ON "utilizatori"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilizator_departamente_utilizator_id_departament_id_key" ON "utilizator_departamente"("utilizator_id", "departament_id");

-- CreateIndex
CREATE UNIQUE INDEX "fonduri_arhiva_cod_key" ON "fonduri_arhiva"("cod");

-- CreateIndex
CREATE UNIQUE INDEX "departamente_primaria_id_cod_key" ON "departamente"("primaria_id", "cod");

-- CreateIndex
CREATE UNIQUE INDEX "registre_departament_id_cod_key" ON "registre"("departament_id", "cod");

-- CreateIndex
CREATE UNIQUE INDEX "inregistrari_registru_id_numar_inregistrare_data_inregistra_key" ON "inregistrari"("registru_id", "numar_inregistrare", "data_inregistrare");

-- CreateIndex
CREATE UNIQUE INDEX "fisiere_cod_bare_key" ON "fisiere"("cod_bare");

-- CreateIndex
CREATE UNIQUE INDEX "roluri_nume_key" ON "roluri"("nume");

-- CreateIndex
CREATE UNIQUE INDEX "permisiuni_nume_key" ON "permisiuni"("nume");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permisiuni_rol_id_permisiune_id_key" ON "rol_permisiuni"("rol_id", "permisiune_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilizator_roluri_utilizator_id_rol_id_key" ON "utilizator_roluri"("utilizator_id", "rol_id");

-- AddForeignKey
ALTER TABLE "utilizatori" ADD CONSTRAINT "utilizatori_primaria_id_fkey" FOREIGN KEY ("primaria_id") REFERENCES "primarii"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizator_departamente" ADD CONSTRAINT "utilizator_departamente_utilizator_id_fkey" FOREIGN KEY ("utilizator_id") REFERENCES "utilizatori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizator_departamente" ADD CONSTRAINT "utilizator_departamente_departament_id_fkey" FOREIGN KEY ("departament_id") REFERENCES "departamente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fonduri_arhiva" ADD CONSTRAINT "fonduri_arhiva_primaria_id_fkey" FOREIGN KEY ("primaria_id") REFERENCES "primarii"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagrame_organizare" ADD CONSTRAINT "diagrame_organizare_fond_arhiva_id_fkey" FOREIGN KEY ("fond_arhiva_id") REFERENCES "fonduri_arhiva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamente" ADD CONSTRAINT "departamente_primaria_id_fkey" FOREIGN KEY ("primaria_id") REFERENCES "primarii"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamente" ADD CONSTRAINT "departamente_responsabil_id_fkey" FOREIGN KEY ("responsabil_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registre" ADD CONSTRAINT "registre_departament_id_fkey" FOREIGN KEY ("departament_id") REFERENCES "departamente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inregistrari" ADD CONSTRAINT "inregistrari_registru_id_fkey" FOREIGN KEY ("registru_id") REFERENCES "registre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fisiere" ADD CONSTRAINT "fisiere_inregistrare_id_fkey" FOREIGN KEY ("inregistrare_id") REFERENCES "inregistrari"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fisiere" ADD CONSTRAINT "fisiere_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorii_documente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisiuni" ADD CONSTRAINT "rol_permisiuni_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roluri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisiuni" ADD CONSTRAINT "rol_permisiuni_permisiune_id_fkey" FOREIGN KEY ("permisiune_id") REFERENCES "permisiuni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizator_roluri" ADD CONSTRAINT "utilizator_roluri_utilizator_id_fkey" FOREIGN KEY ("utilizator_id") REFERENCES "utilizatori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizator_roluri" ADD CONSTRAINT "utilizator_roluri_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roluri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizator_roluri" ADD CONSTRAINT "utilizator_roluri_acordat_de_fkey" FOREIGN KEY ("acordat_de") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_utilizator_id_fkey" FOREIGN KEY ("utilizator_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_fisier_id_fkey" FOREIGN KEY ("fisier_id") REFERENCES "fisiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "istoric_fisiere" ADD CONSTRAINT "istoric_fisiere_fisier_id_fkey" FOREIGN KEY ("fisier_id") REFERENCES "fisiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "istoric_fisiere" ADD CONSTRAINT "istoric_fisiere_modificat_de_fkey" FOREIGN KEY ("modificat_de") REFERENCES "utilizatori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_procesari" ADD CONSTRAINT "ai_procesari_fisier_id_fkey" FOREIGN KEY ("fisier_id") REFERENCES "fisiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
