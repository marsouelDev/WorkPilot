-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
