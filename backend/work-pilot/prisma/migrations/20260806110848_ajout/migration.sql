/*
  Warnings:

  - Changed the type of `complexite` on the `taches` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Complexite" AS ENUM ('faible', 'moyenne', 'élevée');

-- CreateEnum
CREATE TYPE "RoleProjet" AS ENUM ('chef_projet', 'developpeur', 'relecteur');

-- AlterTable
ALTER TABLE "taches" DROP COLUMN "complexite",
ADD COLUMN     "complexite" "Complexite" NOT NULL;

-- CreateTable
CREATE TABLE "membres" (
    "id" SERIAL NOT NULL,
    "projetId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "role" "RoleProjet" NOT NULL DEFAULT 'developpeur',
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membres_projetId_utilisateurId_key" ON "membres"("projetId", "utilisateurId");

-- AddForeignKey
ALTER TABLE "membres" ADD CONSTRAINT "membres_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres" ADD CONSTRAINT "membres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
