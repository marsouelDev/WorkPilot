"use client";

import { useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  CircleDot,
  FileText,
  Folder,
  ListTodo,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";

export default function AdminProjectsPage() {
  const { token, hasHydrated } = useAuthStore();
  const { projets, isLoading, error, getSystemProjects } = useProjectStore();

  useEffect(() => {
    if (hasHydrated && token) {
      getSystemProjects(token);
    }
  }, [hasHydrated, token, getSystemProjects]);

  if (!hasHydrated || isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
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
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-20 w-full" />
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
      <div className="flex min-h-100 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Impossible de charger les projets</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={() => {
                if (token) {
                  getSystemProjects(token);
                }
              }}
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

  const totalTaches = projets.reduce(
    (total, projet) => total + (projet.taches?.length ?? 0),
    0,
  );

  const totalTachesTerminees = projets.reduce(
    (total, projet) =>
      total +
      (projet.taches?.filter((tache) => tache.statut === "terminee").length ??
        0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tous les projets</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Consultez tous les projets, leurs membres, leurs tâches et leurs
          cahiers des charges.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Folder className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Projets</p>

              <p className="text-2xl font-bold">{totalProjets}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Membres</p>

              <p className="text-2xl font-bold">{totalMembres}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ListTodo className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tâches</p>

              <p className="text-2xl font-bold">{totalTaches}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tâches terminées</p>

              <p className="text-2xl font-bold">{totalTachesTerminees}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {projets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Folder className="mb-4 h-12 w-12 text-muted-foreground" />

            <h2 className="text-lg font-semibold">Aucun projet</h2>

            <p className="mt-1 text-center text-sm text-muted-foreground">
              Aucun projet n&apos;a encore été créé.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projets.map((projet) => {
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
                className="flex h-full flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="truncate">{projet.titre}</CardTitle>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {projet.descriptionSommaire}
                  </p>
                </CardHeader>

                <CardContent className="mt-auto space-y-5">
                  <div className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />

                      <span className="text-xs font-medium text-muted-foreground">
                        Créateur
                      </span>
                    </div>

                    <p className="text-sm font-semibold">
                      {projet.createur?.username ?? "Utilisateur"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {projet.createur?.email ?? "Email non disponible"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />

                        <span className="text-xs">Membres</span>
                      </div>

                      <p className="mt-1 text-xl font-bold">
                        {totalMembresProjet}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ListTodo className="h-4 w-4" />

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
                        <CircleDot className="h-4 w-4 text-muted-foreground" />

                        <span className="text-xs">Disponibles</span>

                        <span className="ml-auto text-xs font-semibold">
                          {tachesDisponibles}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-muted-foreground" />

                        <span className="text-xs">En cours</span>

                        <span className="ml-auto text-xs font-semibold">
                          {tachesEnCours}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />

                        <span className="text-xs">Terminées</span>

                        <span className="ml-auto text-xs font-semibold">
                          {tachesTerminees}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />

                      <span className="text-sm">Cahier des charges</span>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        projet.cahierDesCharges
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {projet.cahierDesCharges ? "Disponible" : "Non généré"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Créé le{" "}
                    {new Date(projet.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
