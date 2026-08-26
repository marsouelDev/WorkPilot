"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  GitMerge,
  GitPullRequest,
  Inbox,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { usePullRequestStore } from "@/stores/pullRequestStore";
import type { PullRequest, StatutPullRequest } from "@/types/pullRequestType";
import { Button } from "@/components/ui/button";
import RejectPRDialog from "@/app/components/pull-requests/RejectPRDialog";

const STATUTS: Record<
  StatutPullRequest,
  { label: string; color: string; soft: string; Icon: typeof Eye }
> = {
  ouverte: {
    label: "Ouverte",
    color: "#10b981",
    soft: "rgba(16, 185, 129, 0.12)",
    Icon: Eye,
  },
  fusionnee: {
    label: "Fusionnée",
    color: "#8b5cf6",
    soft: "rgba(139, 92, 246, 0.12)",
    Icon: GitMerge,
  },
  rejetee: {
    label: "Rejetée",
    color: "#ef4444",
    soft: "rgba(239, 68, 68, 0.12)",
    Icon: XCircle,
  },
};

function tempsRelatif(date: string, now: number): string {
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return `il y a ${jours} j`;
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis-l" | "ellipsis-r")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis-l" | "ellipsis-r")[] = [1];
  if (current > 3) pages.push("ellipsis-l");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("ellipsis-r");
  pages.push(total);
  return pages;
}

function StatCard({
  label,
  value,
  color,
  Icon,
}: {
  label: string;
  value: number;
  color: string;
  Icon: typeof Eye;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function PullRequestsPage() {
  const { token, user } = useAuthStore();
  const {
    pullRequests,
    isLoading,
    error,
    charger,
    fusionner,
    rejeter,
    clearError,
  } = usePullRequestStore();

  const [scope, setScope] = useState<string>("mes-projets");
  const [mergingId, setMergingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [prToReject, setPrToReject] = useState<PullRequest | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ✅ Timestamp figé pour la pureté React */
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (token) charger(token, scope);
  }, [token, scope, charger]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleScopeChange = (newScope: string) => {
    setScope(newScope);
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const stats = useMemo(() => {
    const total = pullRequests.length;
    const fusionnees = pullRequests.filter(
      (p) => p.statut === "fusionnee",
    ).length;
    const ouvertes = pullRequests.filter((p) => p.statut === "ouverte").length;
    const rejetees = pullRequests.filter((p) => p.statut === "rejetee").length;
    const mesPr = pullRequests.filter((p) => p.auteur?.id === user?.id).length;
    return { total, fusionnees, ouvertes, rejetees, mesPr };
  }, [pullRequests, user?.id]);

  const totalPages = Math.max(1, Math.ceil(pullRequests.length / pageSize));

  const effectivePage = useMemo(
    () => Math.min(page, totalPages),
    [page, totalPages],
  );

  const paginatedPrs = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return pullRequests.slice(start, start + pageSize);
  }, [pullRequests, effectivePage, pageSize]);

  const debut = (effectivePage - 1) * pageSize;
  const fin = Math.min(debut + pageSize, pullRequests.length);

  /* ===== Fusion ===== */
  const handleMerge = async (pr: PullRequest) => {
    if (!token || mergingId !== null) return;

    if (!pr.canMerge) {
      toast.error(
        "Vous n'avez pas la permission de fusionner cette PR. Seuls le chef de projet et les relecteurs peuvent fusionner.",
      );
      return;
    }

    setMergingId(pr.id);
    const ok = await fusionner(token, pr.id);
    setMergingId(null);

    if (ok) {
      toast.success(`PR #${pr.numero} fusionnée — tâche terminée ✅`);
    } else {
      toast.error("Fusion impossible (conflit ou PR déjà fermée)");
    }
  };

  const handleOpenReject = (pr: PullRequest) => {
    setPrToReject(pr);
    setRejectDialogOpen(true);
  };

  const handleReject = async (motif: string) => {
    if (!token || !prToReject) return false;

    setRejectingId(prToReject.id);
    const ok = await rejeter(token, prToReject.id, motif);
    setRejectingId(null);

    if (ok) {
      toast.success(
        `PR #${prToReject.numero} rejetée — la tâche retourne en attribution`,
      );
      setRejectDialogOpen(false);
      setPrToReject(null);
      return true;
    }

    return false;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <GitPullRequest className="h-5 w-5 text-[#6366F1]" />
            Pull Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivi des pull requests créées depuis l&apos;IDE WorkPilot
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={scope}
            onChange={(e) => handleScopeChange(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40"
          >
            <option value="mes-projets">Tous mes projets</option>
            <option value="mes-pr">Mes tâches assignées</option>
          </select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => token && charger(token, scope)}
            disabled={isLoading}
            title="Actualiser"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          color="#6366F1"
          Icon={GitPullRequest}
        />
        <StatCard
          label="Ouvertes"
          value={stats.ouvertes}
          color="#10b981"
          Icon={CheckCircle2}
        />
        <StatCard
          label="Fusionnées"
          value={stats.fusionnees}
          color="#8b5cf6"
          Icon={GitMerge}
        />
        <StatCard
          label="Rejetées"
          value={stats.rejetees}
          color="#ef4444"
          Icon={XCircle}
        />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-slate-200/70"
            />
          ))}
        </div>
      ) : pullRequests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Inbox className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Aucune pull request
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Les PR créées depuis l&apos;IDE apparaîtront ici avec leur statut
              (ouverte, fusionnée, rejetée).
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Tâche</th>
                  <th className="px-4 py-3 text-left font-semibold">Branche</th>
                  <th className="px-4 py-3 text-left font-semibold">Auteur</th>
                  <th className="px-4 py-3 text-left font-semibold">Projet</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Créée</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPrs.map((pr) => {
                  const cfg = STATUTS[pr.statut];
                  const Icon = cfg.Icon;
                  const isMerging = mergingId === pr.id;
                  const isRejecting = rejectingId === pr.id;
                  const auteurLabel = pr.auteur
                    ? `${pr.auteur.prenom} ${pr.auteur.nom}`
                    : "—";
                  const isMyPr = pr.auteur?.id === user?.id;

                  return (
                    <tr key={pr.id} className="transition hover:bg-slate-50/60">
                      <td className="max-w-xs px-4 py-3">
                        <p className="truncate font-medium text-slate-900">
                          {pr.tache?.titre ?? "Tâche"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <code className="rounded bg-[#6366F1]/10 px-1.5 py-0.5 font-mono text-xs text-[#6366F1]">
                          {pr.branche}
                        </code>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                              isMyPr ? "bg-[#6366F1]" : "bg-slate-400"
                            }`}
                          >
                            {pr.auteur?.prenom?.charAt(0) ?? "?"}
                            {pr.auteur?.nom?.charAt(0) ?? ""}
                          </div>
                          <span className="truncate text-xs text-slate-700">
                            {auteurLabel}
                            {isMyPr && (
                              <span className="ml-1 text-[10px] text-[#6366F1]">
                                (moi)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-xs px-4 py-3">
                        <p className="truncate text-xs text-slate-600">
                          {pr.tache?.projet?.titre ?? "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            color: cfg.color,
                            backgroundColor: cfg.soft,
                          }}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {tempsRelatif(pr.createdAt, now)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Lien GitHub */}
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            title="Voir sur GitHub"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>

                          {/* ✅ PR ouverte : boutons Fusionner + Rejeter */}
                          {pr.statut === "ouverte" && pr.canMerge && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMerge(pr)}
                                disabled={isMerging || isRejecting}
                                className="h-8 gap-1.5 bg-[#8b5cf6] text-xs text-white hover:bg-[#7c3aed]"
                              >
                                {isMerging ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <GitMerge className="h-3.5 w-3.5" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReject(pr)}
                                disabled={isMerging || isRejecting}
                                className="h-8 gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                {isRejecting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </>
                          )}

                          {/* PR ouverte sans permission */}
                          {pr.statut === "ouverte" && !pr.canMerge && (
                            <span
                              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-500"
                              title="Seuls le chef de projet et les relecteurs peuvent fusionner ou rejeter"
                            >
                              En attente
                            </span>
                          )}

                          {/* PR fusionnée */}
                          {pr.statut === "fusionnee" && (
                            <span className="inline-flex h-8 items-center gap-1 rounded-md border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-2.5 text-[11px] font-semibold text-[#8b5cf6]">
                              <CheckCircle2 className="h-3 w-3" />
                              Acceptée
                            </span>
                          )}

                          {/* PR rejetée */}
                          {pr.statut === "rejetee" && (
                            <span className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-600">
                              <XCircle className="h-3 w-3" />
                              Refusée
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              Affichage{" "}
              <span className="font-semibold text-slate-700">
                {debut + 1}–{fin}
              </span>{" "}
              sur{" "}
              <span className="font-semibold text-slate-700">
                {pullRequests.length}
              </span>{" "}
              Pull Requests
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Lignes :</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={effectivePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers(effectivePage, totalPages).map((p) =>
                  typeof p === "number" ? (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${
                        p === effectivePage
                          ? "bg-[#6366F1] text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={p} className="px-1 text-xs text-slate-400">
                      …
                    </span>
                  ),
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={effectivePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  title="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Dialog de rejet */}
      {prToReject && (
        <RejectPRDialog
          pr={prToReject}
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          onReject={handleReject}
          isRejecting={rejectingId === prToReject.id}
        />
      )}
    </div>
  );
}
