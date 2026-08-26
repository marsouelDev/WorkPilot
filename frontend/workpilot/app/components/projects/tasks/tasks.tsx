"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Gauge,
  Hand,
  ListTodo,
  Loader2,
  Sparkles,
  Timer,
  Upload,
  User,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useTaskStore } from "@/stores/tacheStore";
import type { Tache } from "@/types/projectType";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TaskDetailsDialog from "./TaskDetails";
import SoumettreLivrableDialog from "@/app/components/livrable/SoumettreLivrableForm";

/* ==========================================================
   TYPES
========================================================== */
interface ProjectTasksProps {
  projetId: number;
}

interface TimeLeft {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
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
  onSubmitLivrable: (tache: Tache) => void;
}

/* ==========================================================
   CONFIGURATION DES STATUTS
========================================================== */
const STATUT_CONFIG: Record<
  string,
  { label: string; badge: string; accent: string }
> = {
  disponible: {
    label: "Disponible",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    accent: "bg-emerald-400",
  },
  attribuee: {
    label: "Attribuée",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    accent: "bg-blue-400",
  },
  en_revue: {
    label: "En revue",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    accent: "bg-amber-400",
  },
  retiree: {
    label: "Retirée",
    badge: "bg-red-50 text-red-700 ring-red-200",
    accent: "bg-red-400",
  },
  terminee: {
    label: "Terminée",
    badge: "bg-teal-50 text-teal-700 ring-teal-200",
    accent: "bg-teal-400",
  },
};

/* ==========================================================
   HELPERS
========================================================== */
const formatDate = (date: string | null): string => {
  if (!date) return "Aucune échéance";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

function normalizeComplexite(c: string): "faible" | "moyenne" | "elevee" {
  const n = c
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (n.startsWith("f")) return "faible";
  if (n.startsWith("m")) return "moyenne";
  return "elevee";
}

function getTimeLeft(echeance: string | null): TimeLeft {
  const empty: TimeLeft = {
    expired: true,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  };

  if (!echeance) return empty;

  const diff = new Date(echeance).getTime() - Date.now();
  if (diff <= 0) return empty;

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
  };
}

function useCountdown(echeance: string | null, isActive: boolean): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(echeance),
  );

  useEffect(() => {
    if (!echeance || !isActive) return;

    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(echeance));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [echeance, isActive]);

  return timeLeft;
}

/* ==========================================================
   COMPOSANTS VISUELS
========================================================== */

/** Badge de compte à rebours */
function CountdownBadge({ timeLeft }: { timeLeft: TimeLeft }) {
  if (timeLeft.expired) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 border-red-300 bg-red-100 px-1.5 py-0.5 text-[9px] text-red-700 sm:px-2 sm:text-[10px]"
      >
        <Clock3 className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
        <span className="hidden sm:inline">Délai dépassé</span>
        <span className="sm:hidden">Dépassé</span>
      </Badge>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const pad = (n: number) => String(n).padStart(2, "0");

  const colorClass =
    days === 0
      ? "border-red-300 bg-red-100 text-red-700"
      : days < 2
        ? "border-orange-300 bg-orange-100 text-orange-700"
        : "border-emerald-300 bg-emerald-100 text-emerald-700";

  /* Format compact mobile, complet tablette/desktop */
  const labelMobile =
    days > 0 ? `${days}j` : hours > 0 ? `${hours}h` : `${minutes}m`;

  const labelDesktop =
    days > 0
      ? `${days}j ${pad(hours)}h ${pad(minutes)}m`
      : hours > 0
        ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
        : `${pad(minutes)}m ${pad(seconds)}s`;

  return (
    <Badge
      variant="outline"
      className={`shrink-0 px-1.5 py-0.5 text-[9px] tabular-nums sm:px-2 sm:text-[10px] ${colorClass}`}
    >
      <Timer className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
      <span className="hidden sm:inline">{labelDesktop}</span>
      <span className="sm:hidden">{labelMobile}</span>
    </Badge>
  );
}

/** Indicateur visuel de complexité (barres) */
function ComplexityMeter({ complexite }: { complexite: string }) {
  const level = normalizeComplexite(complexite);

  const config = {
    faible: {
      bars: 1,
      color: "bg-emerald-500",
      text: "text-emerald-600",
      label: "Faible",
    },
    moyenne: {
      bars: 2,
      color: "bg-amber-500",
      text: "text-amber-600",
      label: "Moyenne",
    },
    elevee: {
      bars: 3,
      color: "bg-red-500",
      text: "text-red-600",
      label: "Élevée",
    },
  }[level];

  const heights = ["h-1.5", "h-2.5", "h-3.5"];

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <div className="flex items-end gap-0.5">
        {heights.map((h, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-sm sm:w-1 ${h} ${
              i < config.bars ? config.color : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-semibold sm:text-xs ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

/** Tuile d'information compacte */
function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 sm:gap-2.5 sm:px-2.5 sm:py-2">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 sm:text-[10px]">
          {label}
        </p>
        <div className="truncate text-[11px] font-medium text-slate-700 sm:text-xs">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   CARTE DE TÂCHE
========================================================== */
function TaskCard({
  tache,
  isAssignedToCurrentUser,
  isTaskAssigned,
  isCurrentTaskLoading,
  isChoosingTask,
  onChoose,
  onOpenIA,
  onSee,
  onSubmitLivrable,
}: TaskCardProps) {
  const config = STATUT_CONFIG[tache.statut] ?? STATUT_CONFIG.disponible;

  const estVerrouillee =
    tache.statut === "terminee" || tache.statut === "en_revue";

  const peutSoumettre = isAssignedToCurrentUser && tache.statut === "attribuee";

  const timeLeft = useCountdown(
    tache.echeance,
    isAssignedToCurrentUser && !estVerrouillee,
  );

  const initiales = tache.assignee
    ? `${tache.assignee.prenom?.charAt(0) ?? ""}${tache.assignee.nom?.charAt(0) ?? ""}`
    : null;

  return (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Barre d'accent colorée selon le statut */}
      <div className={`absolute inset-x-0 top-0 h-1 ${config.accent}`} />

      <CardHeader className="p-3 pb-0 sm:p-4 sm:pb-0 lg:p-5 lg:pb-0">
        <div className="space-y-2 sm:space-y-2.5">
          <CardTitle className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm lg:text-[15px]">
            {tache.titre}
          </CardTitle>

          {/* Badges de statut + compte à rebours */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <Badge
              variant="outline"
              className={`shrink-0 border-0 px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset sm:px-2 sm:text-[10px] ${config.badge}`}
            >
              {tache.statut === "terminee" ? (
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
              ) : (
                <Clock3 className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
              )}
              {config.label}
            </Badge>

            {isAssignedToCurrentUser && tache.echeance && !estVerrouillee && (
              <CountdownBadge timeLeft={timeLeft} />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-3 pt-2 sm:p-4 sm:pt-3 lg:p-5 lg:pt-3">
        {/* Tuiles d'information */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <InfoTile
            label="Assignée à"
            icon={
              tache.assignee ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 text-[9px] font-bold text-[#6366F1] sm:h-7 sm:w-7 sm:text-[10px]">
                  {initiales}
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white sm:h-7 sm:w-7">
                  <User className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
                </div>
              )
            }
          >
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="truncate">
                {tache.assignee
                  ? `${tache.assignee.prenom} ${tache.assignee.nom}`
                  : "Non assignée"}
              </span>
              {isAssignedToCurrentUser && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-1 py-px text-[8px] font-bold text-emerald-700 sm:px-1.5 sm:text-[9px]">
                  Vous
                </span>
              )}
            </span>
          </InfoTile>

          <InfoTile
            label="Échéance"
            icon={
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200/70 sm:h-7 sm:w-7">
                <CalendarDays className="h-3 w-3 text-slate-500 sm:h-3.5 sm:w-3.5" />
              </div>
            }
          >
            {formatDate(tache.echeance)}
          </InfoTile>

          <div className="col-span-2">
            <InfoTile
              label="Complexité"
              icon={
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200/70 sm:h-7 sm:w-7">
                  <Gauge className="h-3 w-3 text-slate-500 sm:h-3.5 sm:w-3.5" />
                </div>
              }
            >
              <ComplexityMeter complexite={tache.complexite} />
            </InfoTile>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="mt-auto pt-3 sm:pt-4">
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-2.5 sm:flex-row sm:items-center sm:pt-3">
            {/* Actions secondaires */}
            <div className="grid flex-1 grid-cols-2 gap-1.5 sm:flex sm:flex-none sm:gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onOpenIA(tache.id)}
                disabled={!isAssignedToCurrentUser || estVerrouillee}
                title={
                  estVerrouillee
                    ? "Cette tâche est déjà en revue ou terminée"
                    : !isTaskAssigned
                      ? "Choisissez d'abord cette tâche pour accéder à l'IA"
                      : !isAssignedToCurrentUser
                        ? "Seule la personne assignée peut utiliser l'IA"
                        : "Ouvrir l'assistant IA"
                }
                className={`h-8 w-full text-[10px] sm:h-9 sm:w-auto sm:text-xs ${
                  !isAssignedToCurrentUser || estVerrouillee
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <Sparkles className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                IA
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onSee(tache)}
                className="h-8 w-full text-[10px] sm:h-9 sm:w-auto sm:text-xs"
              >
                <Eye className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                Voir
              </Button>
            </div>

            {/* Action principale */}
            {peutSoumettre ? (
              <Button
                size="sm"
                onClick={() => onSubmitLivrable(tache)}
                className="h-8 w-full bg-emerald-600 text-[10px] text-white hover:bg-emerald-700 sm:h-9 sm:ml-auto sm:w-auto sm:min-w-32 sm:text-xs"
              >
                <Upload className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                Soumettre
              </Button>
            ) : !isTaskAssigned ? (
              <Button
                size="sm"
                onClick={() => onChoose(tache.id)}
                disabled={isCurrentTaskLoading || isChoosingTask}
                className="h-8 w-full bg-[#6366F1] text-[10px] text-white hover:bg-[#4f46e5] sm:h-9 sm:ml-auto sm:w-auto sm:min-w-32 sm:text-xs"
              >
                {isCurrentTaskLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Attribution...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Hand className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                    Choisir
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="h-8 w-full cursor-not-allowed text-[10px] opacity-60 sm:h-9 sm:ml-auto sm:w-auto sm:min-w-32 sm:text-xs"
              >
                <CheckCircle2 className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">OK</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ==========================================================
   COMPOSANT PRINCIPAL
========================================================== */
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

  /* Dialogs */
  const [selectedTask, setSelectedTask] = useState<Tache | null>(null);
  const [taskLoadingId, setTaskLoadingId] = useState<number | null>(null);
  const [dialogLivrableOpen, setDialogLivrableOpen] = useState(false);
  const [tachePourLivrable, setTachePourLivrable] = useState<Tache | null>(
    null,
  );

  /* ===== Chargement initial ===== */
  useEffect(() => {
    if (!hasHydrated || !projetId || Number.isNaN(projetId) || !token) return;

    listerTachesDuProjet(projetId, token).catch((err) => {
      console.error("Erreur récupération tâches :", err);
    });
  }, [projetId, token, hasHydrated, listerTachesDuProjet]);

  /* ===== Auto-clear des erreurs ===== */
  useEffect(() => {
    if (!taskError) return;

    const timer = window.setTimeout(() => clearError(), 3000);
    return () => window.clearTimeout(timer);
  }, [taskError, clearError]);

  /* ===== Handlers ===== */
  const handleChoisirTache = async (tacheId: number) => {
    if (!token || taskLoadingId !== null) return;

    clearError();

    try {
      setTaskLoadingId(tacheId);
      await choisirTache(token, tacheId);
      await listerTachesDuProjet(projetId, token);

      toast.custom(
        (toastId) => (
          <div className="relative w-full max-w-sm rounded-xl border border-green-200 bg-green-50 p-4 shadow-lg">
            <button
              type="button"
              onClick={() => toast.dismiss(toastId)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-green-600 transition-colors hover:bg-green-100"
              aria-label="Fermer"
            >
              ×
            </button>

            <div className="flex items-start gap-3 pr-7">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-700">
                  Tâche choisie avec succès
                </h3>
                <p className="mt-1 text-xs leading-5 text-green-600">
                  La tâche vous a été attribuée. Vous disposez de 3 jours pour
                  la terminer.
                </p>
              </div>
            </div>
          </div>
        ),
        { duration: 2000 },
      );
    } catch (error) {
      toast.custom(
        (toastId) => (
          <div className="relative w-full max-w-sm rounded-xl border border-red-200 bg-red-50 p-4 shadow-lg">
            <button
              type="button"
              onClick={() => toast.dismiss(toastId)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-100"
              aria-label="Fermer"
            >
              ×
            </button>

            <div className="flex items-start gap-3 pr-7">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-lg font-bold text-red-600">!</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-700">
                  Impossible de choisir la tâche
                </h3>
                <p className="mt-1 text-xs leading-5 text-red-600">
                  {error instanceof Error
                    ? error.message
                    : "Une erreur est survenue."}
                </p>
              </div>
            </div>
          </div>
        ),
        { duration: 2000 },
      );
    } finally {
      setTaskLoadingId(null);
    }
  };

  const handleOpenIA = (tacheId: number) => {
    router.push(`/projects/${projetId}/tasks/${tacheId}/ia`);
  };

  const handleOuvrirLivrable = (tache: Tache) => {
    setTachePourLivrable(tache);
    setDialogLivrableOpen(true);
  };

  /* ===== Tri par titre ===== */
  const tachesTriees = [...tachesProjet].sort((a, b) =>
    a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" }),
  );

  /* ===== Chargement ===== */
  if (!hasHydrated || isLoadingTachesProjet) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-1 w-full bg-slate-200" />
            <CardHeader className="p-3 pb-0 sm:p-4 sm:pb-0 lg:p-5 lg:pb-0">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-3 pt-2 sm:p-4 sm:pt-3 sm:space-y-3 lg:p-5 lg:pt-3">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="h-11 animate-pulse rounded-lg bg-muted sm:h-12" />
                <div className="h-11 animate-pulse rounded-lg bg-muted sm:h-12" />
                <div className="col-span-2 h-11 animate-pulse rounded-lg bg-muted sm:h-12" />
              </div>
              <div className="h-8 w-full animate-pulse rounded-md bg-muted sm:h-9" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  /* ===== Erreur ===== */
  if (tachesProjetError) {
    return (
      <Card>
        <CardContent className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
          <ListTodo className="mb-3 h-10 w-10 text-destructive" />
          <h3 className="font-semibold">Impossible de charger les tâches</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tachesProjetError}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              if (token && projetId) listerTachesDuProjet(projetId, token);
            }}
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ===== Rendu principal ===== */
  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
          Tâches du projet
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground sm:mt-1 sm:text-xs lg:text-sm">
          {nombreTachesProjet} {nombreTachesProjet > 1 ? "tâches" : "tâche"}
        </p>
      </div>

      {/* Erreur temporaire */}
      {taskError && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 sm:p-3 sm:text-sm">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span>{taskError}</span>
        </div>
      )}

      {/* Liste vide */}
      {tachesTriees.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
            <ListTodo className="mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold">Aucune tâche</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ce projet ne contient encore aucune tâche.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* ✅ Grille adaptative : 1 col mobile, 2 col tablette, 3 col desktop */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2">
          {tachesTriees.map((tache) => {
            const isAssignedToCurrentUser =
              !!user &&
              !!tache.assignee &&
              Number(tache.assignee.id) === Number(user.id);

            const isTaskAssigned =
              tache.assignee !== null && tache.assignee !== undefined;

            return (
              <TaskCard
                key={tache.id}
                tache={tache}
                isAssignedToCurrentUser={isAssignedToCurrentUser}
                isTaskAssigned={isTaskAssigned}
                isCurrentTaskLoading={taskLoadingId === tache.id}
                isChoosingTask={isChoosingTask}
                onChoose={handleChoisirTache}
                onOpenIA={handleOpenIA}
                onSee={setSelectedTask}
                onSubmitLivrable={handleOuvrirLivrable}
              />
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <TaskDetailsDialog
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      {tachePourLivrable && (
        <SoumettreLivrableDialog
          tacheId={tachePourLivrable.id}
          tacheTitre={tachePourLivrable.titre}
          open={dialogLivrableOpen}
          onOpenChange={(open: boolean) => {
            setDialogLivrableOpen(open);
            if (!open) setTachePourLivrable(null);
          }}
          onSubmitted={() => {
            if (token && projetId) listerTachesDuProjet(projetId, token);
          }}
        />
      )}
    </div>
  );
}
