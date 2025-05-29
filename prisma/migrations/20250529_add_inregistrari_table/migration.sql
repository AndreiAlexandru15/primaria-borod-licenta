-- CreateTable
CREATE TABLE "inregistrari" (
    "id" TEXT NOT NULL,
    "registru_id" TEXT NOT NULL,
    "numar_inregistrare" TEXT NOT NULL,
    "data_inregistrare" DATE NOT NULL,
    "expeditor" TEXT,
    "destinatar" TEXT,
    "obiect" TEXT NOT NULL,
    "observatii" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inregistrari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inregistrare_documente" (
    "id" TEXT NOT NULL,
    "inregistrare_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "ordinea" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inregistrare_documente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inregistrari_registru_id_numar_inregistrare_data_inregis_key" ON "inregistrari"("registru_id", "numar_inregistrare", "data_inregistrare");

-- CreateIndex
CREATE UNIQUE INDEX "inregistrare_documente_inregistrare_id_document_id_key" ON "inregistrare_documente"("inregistrare_id", "document_id");

-- AddForeignKey
ALTER TABLE "inregistrari" ADD CONSTRAINT "inregistrari_registru_id_fkey" FOREIGN KEY ("registru_id") REFERENCES "registre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inregistrare_documente" ADD CONSTRAINT "inregistrare_documente_inregistrare_id_fkey" FOREIGN KEY ("inregistrare_id") REFERENCES "inregistrari"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inregistrare_documente" ADD CONSTRAINT "inregistrare_documente_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
