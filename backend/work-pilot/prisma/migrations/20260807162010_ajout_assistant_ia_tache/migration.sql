-- CreateEnum
CREATE TYPE "RoleMessageIA" AS ENUM ('utilisateur', 'assistant', 'systeme');

-- CreateTable
CREATE TABLE "conversations_ia" (
    "id" SERIAL NOT NULL,
    "tacheId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages_ia" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "role" "RoleMessageIA" NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_ia_tacheId_utilisateurId_key" ON "conversations_ia"("tacheId", "utilisateurId");

-- AddForeignKey
ALTER TABLE "conversations_ia" ADD CONSTRAINT "conversations_ia_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations_ia" ADD CONSTRAINT "conversations_ia_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_ia" ADD CONSTRAINT "messages_ia_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
