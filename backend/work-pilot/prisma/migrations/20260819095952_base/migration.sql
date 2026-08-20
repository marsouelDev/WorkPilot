-- CreateEnum
CREATE TYPE "RoleGlobal" AS ENUM ('membre', 'admin');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('en_attente_verification', 'actif', 'suspendu');

-- CreateEnum
CREATE TYPE "Complexite" AS ENUM ('faible', 'moyenne', 'élevée');

-- CreateEnum
CREATE TYPE "StatutTache" AS ENUM ('disponible', 'attribuee', 'en_revue', 'retiree', 'terminee');

-- CreateEnum
CREATE TYPE "RoleProjet" AS ENUM ('chef_projet', 'developpeur', 'relecteur');

-- CreateEnum
CREATE TYPE "RoleMessageIA" AS ENUM ('utilisateur', 'assistant', 'systeme');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('invitation_projet', 'changement_role', 'retrait_projet', 'tache_assignee', 'tache_terminee', 'systeme');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasse" TEXT NOT NULL,
    "roleGlobal" "RoleGlobal" NOT NULL DEFAULT 'membre',
    "statut" "StatutCompte" NOT NULL DEFAULT 'en_attente_verification',
    "codeVerificationHache" TEXT,
    "codeVerificationExpire" TIMESTAMP(3),
    "githubUsername" TEXT,
    "githubToken" TEXT,
    "githubLieAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "descriptionSommaire" TEXT NOT NULL,
    "depotGitUrl" TEXT,
    "createurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cahiers_des_charges" (
    "id" SERIAL NOT NULL,
    "projetId" INTEGER NOT NULL,
    "contenuGenere" TEXT NOT NULL,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cahiers_des_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches" (
    "id" SERIAL NOT NULL,
    "projetId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "descriptionGeneree" TEXT NOT NULL,
    "statut" "StatutTache" NOT NULL DEFAULT 'disponible',
    "assigneeId" INTEGER,
    "echeance" TIMESTAMP(3),
    "competences" TEXT[],
    "complexite" "Complexite" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres" (
    "id" SERIAL NOT NULL,
    "projetId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "role" "RoleProjet" NOT NULL DEFAULT 'developpeur',
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations_ia" (
    "id" SERIAL NOT NULL,
    "tacheId" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "projetId" INTEGER,
    "tacheId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_githubUsername_key" ON "utilisateurs"("githubUsername");

-- CreateIndex
CREATE UNIQUE INDEX "projets_depotGitUrl_key" ON "projets"("depotGitUrl");

-- CreateIndex
CREATE UNIQUE INDEX "cahiers_des_charges_projetId_key" ON "cahiers_des_charges"("projetId");

-- CreateIndex
CREATE UNIQUE INDEX "membres_projetId_utilisateurId_key" ON "membres"("projetId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_ia_tacheId_key" ON "conversations_ia"("tacheId");

-- CreateIndex
CREATE INDEX "messages_ia_conversationId_createdAt_idx" ON "messages_ia"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_lue_idx" ON "notifications"("userId", "lue");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cahiers_des_charges" ADD CONSTRAINT "cahiers_des_charges_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres" ADD CONSTRAINT "membres_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres" ADD CONSTRAINT "membres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations_ia" ADD CONSTRAINT "conversations_ia_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_ia" ADD CONSTRAINT "messages_ia_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
