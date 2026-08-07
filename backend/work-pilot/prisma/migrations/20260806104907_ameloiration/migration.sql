/*
  Warnings:

  - Added the required column `complexite` to the `taches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "taches" ADD COLUMN     "competences" TEXT[],
ADD COLUMN     "complexite" TEXT NOT NULL;
