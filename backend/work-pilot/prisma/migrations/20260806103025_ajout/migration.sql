-- CreateEnum
CREATE TYPE "StatutTache" AS ENUM ('disponible', 'attribuee', 'en_revue', 'retiree', 'terminee');

-- CreateTable
CREATE TABLE "projets" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "descriptionSommaire" TEXT NOT NULL,
    "depotGitUrl" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projets_depotGitUrl_key" ON "projets"("depotGitUrl");

-- CreateIndex
CREATE UNIQUE INDEX "cahiers_des_charges_projetId_key" ON "cahiers_des_charges"("projetId");

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cahiers_des_charges" ADD CONSTRAINT "cahiers_des_charges_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
