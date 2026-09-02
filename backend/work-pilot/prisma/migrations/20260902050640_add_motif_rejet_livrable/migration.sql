-- DropIndex
DROP INDEX "idx_projets_created";

-- DropIndex
DROP INDEX "idx_projets_createur_created";

-- DropIndex
DROP INDEX "idx_taches_assignee_dates";

-- DropIndex
DROP INDEX "idx_taches_assignee_statut";

-- DropIndex
DROP INDEX "idx_taches_statut_dates";

-- DropIndex
DROP INDEX "idx_users_created";

-- AlterTable
ALTER TABLE "livrables_finaux" ADD COLUMN     "motifRejet" TEXT;
