"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  GitBranch,
  GitCommit,
  RefreshCw,
  Shield,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useBranchStore } from "@/stores/branchStore";
import type { BranchFilter } from "@/types/branchType";
import { Button } from "@/components/ui/button";

function tempsRelatif(date: string, now: number): string {
  if (!date) return "date inconnue";
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours < 30) return `il y a ${jours} j`;
  const mois = Math.floor(jours / 30);
  return `il y a ${mois} mois`;
}

export default function BranchesPage() {
  const params = useParams();
  const projetId = Number(params.id);
  const { token } = useAuthStore();

  const { branches, isLoading, error, charger, recharger, clearError } =
    useBranchStore();

  const [filter, setFilter] = useState<BranchFilter>("all");
  const [search, setSearch] = useState("");

  const [now] = useState(() => Date.now());

  /* Chargement initial + gestion des erreurs */
  useEffect(() => {
    if (token && projetId) void charger(token, projetId);
  }, [token, projetId, charger]);

  useEffect(() => {
    if (error) {
      toast.error(`Impossible de charger : ${error}`);
      clearError();
    }
  }, [error, clearError]);

  /* Stats calculées */
  const stats = useMemo(() => {
    const semaine = 7 * 24 * 60 * 60 * 1000;
    return {
      total: branches.length,
      actives: branches.filter(
        (b) => now - new Date(b.commit.date).getTime() < semaine,
      ).length,
      protegees: branches.filter((b) => b.protected).length,
    };
  }, [branches, now]);

  /* Filtrage */
  const branchesFiltrees = useMemo(() => {
    return branches.filter((b) => {
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      const age = now - new Date(b.commit.date).getTime();
      if (filter === "actives") return age < 7 * 24 * 60 * 60 * 1000;
      if (filter === "stale") return age > 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [branches, filter, search, now]);

  const handleRecharger = () => {
    if (token) void recharger(token);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <GitBranch className="h-5 w-5 text-[#6366F1]" />
              Branches du projet
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {stats.total} branche{stats.total > 1 ? "s" : ""} ·{" "}
              {stats.actives} active{stats.actives > 1 ? "s" : ""} ·{" "}
              {stats.protegees} protégée{stats.protegees > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={handleRecharger}
          disabled={isLoading}
          title="Actualiser"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Rechercher une branche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 min-w-[200px] flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40"
        />

        <div className="flex rounded-md border border-slate-200 bg-white p-1">
          {(["all", "actives", "stale"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                filter === f
                  ? "bg-[#6366F1] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f === "all"
                ? "Toutes"
                : f === "actives"
                  ? "Actives"
                  : "Anciennes"}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        /* ✅ Skeleton en grille 3 colonnes */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-slate-200/70"
            />
          ))}
        </div>
      ) : branchesFiltrees.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <GitBranch className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Aucune branche trouvée
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {search
                ? "Aucune branche ne correspond à votre recherche."
                : "Ce projet n'a pas encore de branches."}
            </p>
          </div>
        </div>
      ) : (
        /* ✅ GRILLE : 1 colonne mobile, 2 tablette, 3 desktop */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {branchesFiltrees.map((branch) => {
            const age = now - new Date(branch.commit.date).getTime();
            const days = Math.floor(age / (24 * 60 * 60 * 1000));
            const isStale = days > 30;
            const isActive = days < 7;

            return (
              <div
                key={branch.name}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#6366F1]/40 hover:shadow"
              >
                {/* Nom + badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <GitBranch className="h-4 w-4 shrink-0 text-slate-500" />
                  <code className="max-w-full truncate rounded bg-slate-100 px-2 py-0.5 font-mono text-sm font-semibold text-slate-900">
                    {branch.name}
                  </code>

                  {branch.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6366F1]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6366F1]">
                      <Star className="h-3 w-3" />
                      Défaut
                    </span>
                  )}

                  {branch.protected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      <Shield className="h-3 w-3" />
                      Protégée
                    </span>
                  )}

                  {isActive && !branch.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  )}

                  {isStale && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      <Clock className="h-3 w-3" />
                      Inactive ({days}j)
                    </span>
                  )}
                </div>

                {/* Dernier commit */}
                <div className="mt-2.5 flex min-h-0 flex-1 items-start gap-2">
                  <GitCommit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm text-slate-700">
                      {branch.commit.message || "Aucun message"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-mono text-[10px] text-slate-400">
                        {branch.commit.sha.substring(0, 7)}
                      </span>
                      {" · "}
                      {branch.commit.auteur}
                      {" · "}
                      {tempsRelatif(branch.commit.date, now)}
                    </p>
                  </div>
                </div>

                {/* Comparaison ahead/behind */}
                {branch.behindAhead && !branch.isDefault && (
                  <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                    <span>
                      <span className="font-semibold text-emerald-600">
                        +{branch.behindAhead.ahead}
                      </span>{" "}
                      en avance
                    </span>
                    <span>
                      <span className="font-semibold text-red-600">
                        -{branch.behindAhead.behind}
                      </span>{" "}
                      en retard
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}