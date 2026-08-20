-- CreateEnum
CREATE TYPE "StatutPullRequest" AS ENUM ('ouverte', 'approuvee', 'rejetee', 'fusionnee');

-- CreateTable
CREATE TABLE "pull_requests" (
    "id" SERIAL NOT NULL,
    "tacheId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "numero" INTEGER,
    "branche" TEXT,
    "statut" "StatutPullRequest" NOT NULL DEFAULT 'ouverte',
    "creeParIA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pull_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
