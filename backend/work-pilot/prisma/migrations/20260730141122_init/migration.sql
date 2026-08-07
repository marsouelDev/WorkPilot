-- CreateEnum
CREATE TYPE "RoleGlobal" AS ENUM ('membre', 'admin');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('en_attente_verification', 'actif', 'suspendu');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "roleGlobal" "RoleGlobal" NOT NULL DEFAULT 'membre',
    "statut" "StatutCompte" NOT NULL DEFAULT 'en_attente_verification',
    "codeVerificationHache" TEXT,
    "codeVerificationExpire" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");
