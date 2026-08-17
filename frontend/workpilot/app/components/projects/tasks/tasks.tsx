"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Hand,
  ListTodo,
  Loader2,
  Sparkles,
  Timer,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useTaskStore } from "@/stores/tacheStore";
import type { Tache } from "@/types/projectType";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TaskDetailsDialog from "./TaskDetails";
import { toast } from "sonner";

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

interface TimeLeft {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getTimeLeft(echeance: string | null): TimeLeft {
  if (!echeance) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
    };
  }

  const now = Date.now();
  const target = new Date(echeance).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
    };
  }

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
  };
}

function useCountdown(echeance: string | null, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(echeance),
  );

  useEffect(() => {
    if (!echeance || !isActive) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(echeance));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [echeance, isActive]);

  return timeLeft;
}

/* Badge du compte a rebours*/
interface CountdownBadgeProps {
  timeLeft: TimeLeft;
}

function CountdownBadge({ timeLeft }: CountdownBadgeProps) {
  if (timeLeft.expired) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 border-red-300 bg-red-100 text-red-700"
      >
        <Clock3 className="mr-1 h-3.5 w-3.5" />
        Délai dépassé
      </Badge>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  const colorClass =
    days === 0
      ? "border-red-300 bg-red-100 text-red-700"
      : days < 2
        ? "border-orange-300 bg-orange-100 text-orange-700"
        : "border-emerald-300 bg-emerald-100 text-emerald-700";

  const formatNumber = (n: number) => String(n).padStart(2, "0");

  const label =
    days > 0
      ? `${days}j ${formatNumber(hours)}h ${formatNumber(minutes)}m`
      : hours > 0
        ? `${hours}h ${formatNumber(minutes)}m ${formatNumber(seconds)}s`
        : `${formatNumber(minutes)}m ${formatNumber(seconds)}s`;

  return (
    <Badge variant="outline" className={`shrink-0 tabular-nums ${colorClass}`}>
      <Timer className="mr-1 h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

export default function ProjectTasks({ projetId }: ProjectTasksProps) {
  const router = useRouter();

  const { token, user, hasHydrated } = useAuthStore();

  const {
    tachesProjet,
    nombreTachesProjet,
    isLoadingTachesProjet,
    tachesProjetError,
    listerTachesDuProjet,
  } = useProjectStore();

  const {
    choisirTache,
    isChoosingTask,
    error: taskError,
    clearError,
  } = useTaskStore();

  const [selectedTask, setSelectedTask] = useState<Tache | null>(null);
  const [taskLoadingId, setTaskLoadingId] = useState<number | null>(null);

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

  useEffect(() => {
    if (!taskError) {
      return;
    }

    const timer = window.setTimeout(() => {
      clearError();
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [taskError, clearError]);

  const handleChoisirTache = async (tacheId: number) => {
    if (!token) {
      return;
    }

    if (taskLoadingId !== null) {
      return;
    }

    clearError();

    try {
      setTaskLoadingId(tacheId);
      await choisirTache(token, tacheId);
      await listerTachesDuProjet(projetId, token);

      toast.custom(
        (toastId) => (
          <div className="relative w-95 rounded-xl border border-green-200 bg-green-50 p-4 shadow-lg">
            <button
              type="button"
              onClick={() => toast.dismiss(toastId)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-green-600 transition-colors hover:bg-green-100 hover:text-green-800"
              aria-label="Fermer"
            >
              ×
            </button>

            <div className="flex items-start gap-3 pr-7">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h3 className="font-semibold text-green-700">
                  Tâche choisie avec succès
                </h3>

                <p className="mt-1 text-sm leading-5 text-green-600">
                  La tâche vous a été attribuée. Vous disposez de 3 jours pour
                  la terminer.
                </p>
              </div>
            </div>
          </div>
        ),
        {
          duration: 2000,
        },
      );
    } catch (error) {
      console.error("Erreur lors du choix de la tâche :", error);

      toast.custom(
        (toastId) => (
          <div className="relative w-95 rounded-xl border border-red-200 bg-red-50 p-4 shadow-lg">
            <button
              type="button"
              onClick={() => toast.dismiss(toastId)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-100 hover:text-red-800"
              aria-label="Fermer"
            >
              ×
            </button>

            <div className="flex items-start gap-3 pr-7">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-lg font-bold text-red-600">!</span>
              </div>

              <div>
                <h3 className="font-semibold text-red-700">
                  Impossible de choisir la tâche
                </h3>

                <p className="mt-1 text-sm leading-5 text-red-600">
                  {error instanceof Error
                    ? error.message
                    : "Une erreur est survenue."}
                </p>
              </div>
            </div>
          </div>
        ),
        {
          duration: 2000,
        },
      );
    } finally {
      setTaskLoadingId(null);
    }
  };

  const handleOpenIA = (tacheId: number) => {
    router.push(`/projects/${projetId}/tasks/${tacheId}/ia`);
  };

  const tachesTriees = [...tachesProjet].sort((a, b) =>
    a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" }),
  );

  if (!hasHydrated || isLoadingTachesProjet) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-5 w-48 animate-pulse rounded bg-muted" />

                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>

                <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />

                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tachesProjetError) {
    return (
      <Card>
        <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
          <ListTodo className="mb-3 h-10 w-10 text-destructive" />

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
    <div className="space-y-6">
      <style>{`
        @keyframes wp-error-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wp-error-in {
          animation: wp-error-in .3s ease-out both;
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Tâches du projet
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {nombreTachesProjet} {nombreTachesProjet > 1 ? "tâches" : "tâche"}
          </p>
        </div>
      </div>

      {taskError && (
        <div className="wp-error-in flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{taskError}</span>
        </div>
      )}

      {tachesTriees.length === 0 ? (
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
          {tachesTriees.map((tache) => {
            const isAssignedToCurrentUser =
              !!user &&
              !!tache.assignee &&
              Number(tache.assignee.id) === Number(user.id);

            const isTaskAssigned =
              tache.assignee !== null && tache.assignee !== undefined;

            const isCurrentTaskLoading = taskLoadingId === tache.id;

            return (
              <TaskCard
                key={tache.id}
                tache={tache}
                isAssignedToCurrentUser={isAssignedToCurrentUser}
                isTaskAssigned={isTaskAssigned}
                isCurrentTaskLoading={isCurrentTaskLoading}
                isChoosingTask={isChoosingTask}
                onChoose={handleChoisirTache}
                onOpenIA={handleOpenIA}
                onSee={setSelectedTask}
              />
            );
          })}
        </div>
      )}

      {/* DETAILS */}

      <TaskDetailsDialog
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}

interface TaskCardProps {
  tache: Tache;
  isAssignedToCurrentUser: boolean;
  isTaskAssigned: boolean;
  isCurrentTaskLoading: boolean;
  isChoosingTask: boolean;
  onChoose: (id: number) => void;
  onOpenIA: (id: number) => void;
  onSee: (tache: Tache) => void;
}

function TaskCard({
  tache,
  isAssignedToCurrentUser,
  isTaskAssigned,
  isCurrentTaskLoading,
  isChoosingTask,
  onChoose,
  onOpenIA,
  onSee,
}: TaskCardProps) {
  const timeLeft = useCountdown(tache.echeance, isAssignedToCurrentUser);

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="wrap-break-word text-lg">
              {tache.titre}
            </CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {isAssignedToCurrentUser && tache.echeance && (
              <CountdownBadge timeLeft={timeLeft} />
            )}

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

            {isAssignedToCurrentUser && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-emerald-100 text-[10px]"
              >
                Vous
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />

            <span>{formatDate(tache.echeance)}</span>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Complexité : </span>

            <span className="font-medium capitalize">{tache.complexite}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            onClick={() => onChoose(tache.id)}
            disabled={isTaskAssigned || isCurrentTaskLoading || isChoosingTask}
            className={
              !isTaskAssigned
                ? "bg-[#6366F1] hover:bg-[#2d30d8]"
                : "cursor-not-allowed opacity-50"
            }
          >
            {isCurrentTaskLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Attribution...
              </>
            ) : (
              <>
                <Hand className="mr-2 h-4 w-4" />
                {isTaskAssigned ? "attribuée" : "Choisir"}
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenIA(tache.id)}
            disabled={!isAssignedToCurrentUser}
            title={
              !isTaskAssigned
                ? "Choisissez d'abord cette tâche pour accéder à l'IA"
                : !isAssignedToCurrentUser
                  ? "Seule la personne assignée à cette tâche peut utiliser l'IA"
                  : "Ouvrir l'assistant IA"
            }
            className={
              !isAssignedToCurrentUser ? "cursor-not-allowed opacity-50" : ""
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            IA
          </Button>

          <Button variant="outline" size="sm" onClick={() => onSee(tache)}>
            <Eye className="mr-2 h-4 w-4" />
            Voir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
