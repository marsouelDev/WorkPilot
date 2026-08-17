/*
  Warnings:

  - You are about to drop the column `utilisateurId` on the `conversations_ia` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tacheId]` on the table `conversations_ia` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "conversations_ia" DROP CONSTRAINT "conversations_ia_utilisateurId_fkey";

-- DropIndex
DROP INDEX "conversations_ia_tacheId_utilisateurId_key";

-- AlterTable
ALTER TABLE "conversations_ia" DROP COLUMN "utilisateurId";

-- CreateIndex
CREATE UNIQUE INDEX "conversations_ia_tacheId_key" ON "conversations_ia"("tacheId");

-- CreateIndex
CREATE INDEX "messages_ia_conversationId_createdAt_idx" ON "messages_ia"("conversationId", "createdAt");
