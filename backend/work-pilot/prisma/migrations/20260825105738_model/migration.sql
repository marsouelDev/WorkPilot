-- CreateEnum
CREATE TYPE "StatutLivrable" AS ENUM ('soumis', 'valide', 'rejete');

-- CreateTable
CREATE TABLE "livrables_finaux" (
    "id" SERIAL NOT NULL,
    "tacheId" INTEGER NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "statut" "StatutLivrable" NOT NULL DEFAULT 'soumis',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livrables_finaux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "livrables_finaux_tacheId_key" ON "livrables_finaux"("tacheId");

-- AddForeignKey
ALTER TABLE "livrables_finaux" ADD CONSTRAINT "livrables_finaux_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
