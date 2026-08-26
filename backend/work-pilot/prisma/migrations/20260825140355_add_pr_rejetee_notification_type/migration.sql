/*
  Warnings:

  - The values [approuvee] on the enum `StatutPullRequest` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatutPullRequest_new" AS ENUM ('ouverte', 'rejetee', 'fusionnee');
ALTER TABLE "public"."pull_requests" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "pull_requests" ALTER COLUMN "statut" TYPE "StatutPullRequest_new" USING ("statut"::text::"StatutPullRequest_new");
ALTER TYPE "StatutPullRequest" RENAME TO "StatutPullRequest_old";
ALTER TYPE "StatutPullRequest_new" RENAME TO "StatutPullRequest";
DROP TYPE "public"."StatutPullRequest_old";
ALTER TABLE "pull_requests" ALTER COLUMN "statut" SET DEFAULT 'ouverte';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeNotification" ADD VALUE 'membre_retire';
ALTER TYPE "TypeNotification" ADD VALUE 'tache_expiree';
ALTER TYPE "TypeNotification" ADD VALUE 'livrable_soumis';
ALTER TYPE "TypeNotification" ADD VALUE 'livrable_valide';
ALTER TYPE "TypeNotification" ADD VALUE 'livrable_rejete';
ALTER TYPE "TypeNotification" ADD VALUE 'pr_creee';
ALTER TYPE "TypeNotification" ADD VALUE 'pr_fusionnee';
ALTER TYPE "TypeNotification" ADD VALUE 'pr_rejetee';

-- CreateIndex
CREATE INDEX "livrables_finaux_statut_idx" ON "livrables_finaux"("statut");

-- CreateIndex
CREATE INDEX "membres_utilisateurId_idx" ON "membres"("utilisateurId");

-- CreateIndex
CREATE INDEX "membres_projetId_role_idx" ON "membres"("projetId", "role");

-- CreateIndex
CREATE INDEX "notifications_projetId_idx" ON "notifications"("projetId");

-- CreateIndex
CREATE INDEX "notifications_tacheId_idx" ON "notifications"("tacheId");

-- CreateIndex
CREATE INDEX "projets_createurId_idx" ON "projets"("createurId");

-- CreateIndex
CREATE INDEX "pull_requests_tacheId_idx" ON "pull_requests"("tacheId");

-- CreateIndex
CREATE INDEX "pull_requests_statut_idx" ON "pull_requests"("statut");

-- CreateIndex
CREATE INDEX "pull_requests_auteurId_idx" ON "pull_requests"("auteurId");

-- CreateIndex
CREATE INDEX "taches_projetId_idx" ON "taches"("projetId");

-- CreateIndex
CREATE INDEX "taches_assigneeId_idx" ON "taches"("assigneeId");

-- CreateIndex
CREATE INDEX "taches_statut_idx" ON "taches"("statut");

-- CreateIndex
CREATE INDEX "taches_echeance_idx" ON "taches"("echeance");

-- CreateIndex
CREATE INDEX "utilisateurs_email_idx" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_roleGlobal_idx" ON "utilisateurs"("roleGlobal");
