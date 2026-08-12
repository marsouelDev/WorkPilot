"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  ListTodo,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import TaskDetailsDialog from "./TaskDetails";

interface ProjectTasksProps {
  projetId: number;
}

const getStatutLabel = (statut: string) => {
  switch (statut) {
    case "disponible":
      return "Disponible";

    case "attribuee":
      return "Attribuée";

    case "en_revue":
      return "En revue";

    case "retiree":
      return "Retirée";

    case "terminee":
      return "Terminée";

    default:
      return statut;
  }
};

const getStatutClassName = (statut: string) => {
  switch (statut) {
    case "disponible":
      return "border-green-200 bg-green-50 text-green-700";
    case "attribuee":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "en_revue":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "retiree":
      return "border-red-200 bg-red-50 text-red-700";
    case "terminee":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "Aucune échéance";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

export default function ProjectTasks({ projetId }: ProjectTasksProps) {
  const router = useRouter();

  const { token, hasHydrated } = useAuthStore();

  const {
    tachesProjet,
    nombreTachesProjet,
    isLoadingTachesProjet,
    tachesProjetError,
    listerTachesDuProjet,
  } = useProjectStore();

  const [selectedTask, setSelectedTask] = useState<
    (typeof tachesProjet)[number] | null
  >(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!projetId || Number.isNaN(projetId)) {
      return;
    }

    if (!token) {
      return;
    }

    listerTachesDuProjet(projetId, token).catch((error) => {
      console.error("Erreur récupération tâches :", error);
    });
  }, [projetId, token, hasHydrated, listerTachesDuProjet]);

  if (!hasHydrated || isLoadingTachesProjet) {
    return (
      <div className="grid gap-4">
        {" "}
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            {" "}
            <CardHeader>
              {" "}
              <Skeleton className="h-5 w-1/3" />{" "}
              <Skeleton className="h-4 w-1/4" />{" "}
            </CardHeader>{" "}
            <CardContent className="space-y-3">
              {" "}
              <Skeleton className="h-4 w-full" />{" "}
              <Skeleton className="h-4 w-3/4" />{" "}
              <Skeleton className="h-4 w-1/2" />{" "}
            </CardContent>{" "}
          </Card>
        ))}{" "}
      </div>
    );
  }

  if (tachesProjetError) {
    return (
      <Card>
        <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
          <h3 className="font-semibold">Impossible de charger les tâches</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {tachesProjetError}
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              if (token && projetId) {
                listerTachesDuProjet(projetId, token);
              }
            }}
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tâches du projet</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {nombreTachesProjet} {nombreTachesProjet > 1 ? "tâches" : "tâche"}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>

        {tachesProjet.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
              <ListTodo className="mb-3 h-10 w-10 text-muted-foreground" />

              <h3 className="font-semibold">Aucune tâche</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Ce projet ne contient encore aucune tâche.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tachesProjet.map((tache) => (
              <Card
                key={tache.id}
                className="flex h-full flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="wrap-break-word text-lg">
                        {tache.titre}
                      </CardTitle>
                    </div>

                    <Badge
                      variant="outline"
                      className={`shrink-0 ${getStatutClassName(tache.statut)}`}
                    >
                      {tache.statut === "terminee" ? (
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <Clock3 className="mr-1 h-3.5 w-3.5" />
                      )}

                      {getStatutLabel(tache.statut)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />

                      <span
                        className="truncate"
                        title={
                          tache.assignee
                            ? `${tache.assignee.prenom} ${tache.assignee.nom}`
                            : "Non assignée"
                        }
                      >
                        {tache.assignee
                          ? `${tache.assignee.prenom} ${tache.assignee.nom}`
                          : "Non assignée"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />

                      <span>{formatDate(tache.echeance)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Complexité :{" "}
                      </span>

                      <span className="font-medium capitalize">
                        {tache.complexite}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTask(tache)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
