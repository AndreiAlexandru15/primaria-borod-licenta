-- AlterTable
ALTER TABLE "inregistrari" ADD COLUMN     "tip_document_id" TEXT;

-- CreateTable
CREATE TABLE "tipuri_documente" (
    "id" TEXT NOT NULL,
    "registru_id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "descriere" TEXT,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "ordine_sortare" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipuri_documente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipuri_documente_registru_id_cod_key" ON "tipuri_documente"("registru_id", "cod");

-- AddForeignKey
ALTER TABLE "tipuri_documente" ADD CONSTRAINT "tipuri_documente_registru_id_fkey" FOREIGN KEY ("registru_id") REFERENCES "registre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inregistrari" ADD CONSTRAINT "inregistrari_tip_document_id_fkey" FOREIGN KEY ("tip_document_id") REFERENCES "tipuri_documente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
