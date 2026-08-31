/*
  Warnings:

  - You are about to drop the column `images` on the `utilisateurs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "messages_ia" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "utilisateurs" DROP COLUMN "images";
