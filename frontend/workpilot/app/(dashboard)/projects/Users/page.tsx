"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  CircleDot,
  FileText,
  Folder,
  FolderGit2,
  FolderOpen,
  ListTodo,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";
import { Projet } from "@/types/projectType";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProjectsPage() {
  const { token, hasHydrated, user } = useAuthStore();
  const { projets, isLoading, error, getProjectsAll, removeProject } =
    useProjectStore();
  const [recherche, setRecherche] = useState("");
  const [projetSelectionne, setprojetSelectionne] = useState<Projet | null>(
    null,
  );
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [dialogRetraitOpen, setDialogRetraitOpen] = useState(false);

  useEffect(() => {
    if (hasHydrated && token) {
      getProjectsAll(token);
    }
  }, [hasHydrated, token, getProjectsAll]);

  const projetsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    if (!terme) {
      return projets;
    }

    return projets.filter((projet) => {
      const titre = projet.titre?.toLowerCase() ?? "";
      return titre.includes(terme);
    });
  }, [projets, recherche]);

  const handleRetirerProjet = async () => {
    if (!token || !projetSelectionne) {
      return;
    }

    try {
      setIsActionLoading(true);

      await removeProject(token, projetSelectionne.id);

      setDialogRetraitOpen(false);
      setprojetSelectionne(null);

      await getProjectsAll(token);
    } catch (error) {
      console.error("Erreur lors du retrait du projet :", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!hasHydrated || isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>

          <Skeleton className="h-10 w-full sm:w-40" />
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-4 p-5">
                <Skeleton className="h-12 w-12 rounded-lg" />

                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />

                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>

                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="border-red-200">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">
              Impossible de charger vos projets
            </h2>

            <p className="text-sm text-destructive">{error}</p>

            <Button
              onClick={() => {
                if (token) {
                  getProjectsAll(token);
                }
              }}
              className="bg-[#6366F1] text-white hover:bg-[#4f46e5]"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalProjets = projets.length;

  const totalMembres = projets.reduce(
    (total, projet) => total + (projet.membres?.length ?? 0),
    0,
  );

  const utilisateurId = user?.id ? Number(user.id) : null;

  const totalMesTaches = projets.reduce(
    (total, projet) =>
      total +
      (projet.taches?.filter(
        (tache) => utilisateurId !== null && tache.assigneeId === utilisateurId,
      ).length ?? 0),
    0,
  );

  const totalTaches = projets.reduce(
    (total, projet) => total + (projet.taches?.length ?? 0),
    0,
  );

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Mes projets
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Retrouvez tous les projets auxquels vous participez.
            </p>
          </div>

          <Link
            href="/projects/Users/newProjects"
            className={cn(
              buttonVariants({
                size: "default",
              }),
              "w-full bg-[#6366F1] text-white hover:bg-[#2218e6] sm:w-auto",
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau projet
          </Link>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un projet..."
            className="h-11 pl-10 focus-visible:ring-[#6366F1]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#6366F1]/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/10">
                <Folder className="h-6 w-6 text-[#6366F1]" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Mes projets</p>

                <p className="text-2xl font-bold">{totalProjets}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#4f46e5]/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#4f46e5]/10">
                <Users className="h-6 w-6 text-[#4f46e5]" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Membres</p>

                <p className="text-2xl font-bold">{totalMembres}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ListTodo className="h-6 w-6  text-[#6366F1]" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Tâches</p>

                <p className="text-2xl font-bold">{totalTaches}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6366F1]/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/10">
                <CheckCircle2 className="h-6 w-6 text-[#6366F1]" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Mes tâches</p>

                <p className="text-2xl font-bold">{totalMesTaches}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {projetsFiltres.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-4 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6366F1]/10">
                {recherche ? (
                  <Search className="h-7 w-7 text-[#6366F1]" />
                ) : (
                  <Folder className="h-7 w-7 text-[#6366F1]" />
                )}
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                {recherche ? "Aucun projet trouvé" : "Aucun projet"}
              </h2>

              <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                {recherche
                  ? "Aucun projet ne correspond à votre recherche."
                  : "Vous ne participez actuellement à aucun projet."}
              </p>

              {!recherche && (
                <Link
                  href="/projects/Users/newProjects"
                  className={cn(
                    buttonVariants(),
                    "mt-6 bg-[#6366F1] text-white hover:bg-[#4f46e5]",
                  )}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un projet
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projetsFiltres.map((projet) => {
              const totalTachesProjet = projet.taches?.length ?? 0;

              const totalMembresProjet = projet.membres?.length ?? 0;

              const tachesTerminees =
                projet.taches?.filter((tache) => tache.statut === "terminee")
                  .length ?? 0;

              const tachesEnCours =
                projet.taches?.filter(
                  (tache) =>
                    tache.statut === "attribuee" || tache.statut === "en_revue",
                ).length ?? 0;

              const tachesDisponibles =
                projet.taches?.filter((tache) => tache.statut === "disponible")
                  .length ?? 0;

              return (
                <Card
                  key={projet.id}
                  className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/10">
                        <Folder className="h-5 w-5 text-[#6366F1]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {" "}
                        <CardTitle className="line-clamp-2 wrap-break-word text-base leading-5 sm:text-lg">
                          {" "}
                          {projet.titre}{" "}
                        </CardTitle>{" "}
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {projet.descriptionSommaire}
                    </p>
                  </CardHeader>

                  <CardContent className="mt-auto space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border bg-[#6366F1]/5 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 text-[#6366F1]" />
                          <span className="text-xs">Membres</span>
                        </div>

                        <p className="mt-1 text-xl font-bold">
                          {totalMembresProjet}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-[#4f46e5]/5 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ListTodo className="h-4 w-4 text-[#4f46e5]" />
                          <span className="text-xs">Tâches</span>
                        </div>

                        <p className="mt-1 text-xl font-bold">
                          {totalTachesProjet}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="mb-3 text-xs font-medium text-muted-foreground">
                        État des tâches
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CircleDot className="h-4 w-4 text-[#6366F1]" />

                          <span className="text-xs">Disponibles</span>

                          <span className="ml-auto text-xs font-semibold">
                            {tachesDisponibles}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CircleDot className="h-4 w-4 text-[#4f46e5]" />

                          <span className="text-xs">En cours</span>

                          <span className="ml-auto text-xs font-semibold">
                            {tachesEnCours}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />

                          <span className="text-xs">Terminées</span>

                          <span className="ml-auto text-xs font-semibold">
                            {tachesTerminees}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

                        <span className="truncate text-sm">
                          Cahier des charges
                        </span>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                          projet.cahierDesCharges
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {projet.cahierDesCharges ? "Disponible" : "Non généré"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />

                      <span>
                        Créé le{" "}
                        {new Date(projet.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/projects/${projet.id}/cahier-des-charges`}
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "default",
                          }),
                          "w-full sm:flex-1",
                        )}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Voir le projet
                      </Link>

                      {projet.depotGitUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-full shrink-0 sm:w-10"
                          onClick={() =>
                            window.open(
                              projet.depotGitUrl!,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          aria-label="Ouvrir le dépôt Git"
                        >
                          <FolderGit2 className="h-4 w-4" />
                        </Button>
                      )}

                      {projet.createurId === user?.id && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setprojetSelectionne(projet);
                            setDialogRetraitOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Retirer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={dialogRetraitOpen} onOpenChange={setDialogRetraitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le membre</DialogTitle>

            <DialogDescription>
              Voulez-vous vraiment retirer ce projet ?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogRetraitOpen(false)}
              disabled={isActionLoading}
            >
              Annuler
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleRetirerProjet}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrait...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Retirer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
