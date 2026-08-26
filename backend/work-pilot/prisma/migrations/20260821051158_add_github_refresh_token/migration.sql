-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "githubRefreshToken" TEXT,
ADD COLUMN     "githubRefreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "githubTokenExpiresAt" TIMESTAMP(3);
