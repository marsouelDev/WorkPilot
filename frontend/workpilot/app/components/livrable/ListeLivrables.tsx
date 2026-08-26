"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useLivrableStore } from "@/stores/livrableStore";
import type { Livrable, StatutLivrable } from "@/types/livrableType";
import { Button } from "@/components/ui/button";
import RejeterLivrableDialog from "./RejeterLivrableDialog";

const STATUTS: Record<
  StatutLivrable,
  { label: string; color: string; soft: string; Icon: typeof FileText }
> = {
  soumis: {
    label: "En attente",
    color: "#f59e0b",
    soft: "rgba(245, 158, 11, 0.12)",
    Icon: FileText,
  },
  valide: {
    label: "Validé",
    color: "#10b981",
    soft: "rgba(16, 185, 129, 0.12)",
    Icon: CheckCircle2,
  },
  rejete: {
    label: "Rejeté",
    color: "#ef4444",
    soft: "rgba(239, 68, 68, 0.12)",
    Icon: XCircle,
  },
};

type StatutFilter = "all" | StatutLivrable;
type UserRole = "createur" | "relecteur" | "membre" | null;

interface ListeLivrablesProps {
  projetId: number;
}

export default function ListeLivrables({ projetId }: ListeLivrablesProps) {
  const { token, user } = useAuthStore();
  const { livrables, isLoading, error, chargerParProjet, valider, clearError } =
    useLivrableStore();

  const [recherche, setRecherche] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("all");
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  const [dialogRejetOpen, setDialogRejetOpen] = useState(false);
  const [livrableARejeter, setLivrableARejeter] = useState<Livrable | null>(
    null,
  );

  /* Récupération du rôle de l'utilisateur dans le projet */
  useEffect(() => {
    const checkUserRole = async () => {
      if (!token || !user?.id) {
        setIsCheckingRole(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/projects/${projetId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) throw new Error("Impossible de vérifier le rôle");

        const projet = await res.json();

        /* Vérifie si l'utilisateur est le créateur */
        if (projet.createurId === user.id) {
          setUserRole("createur");
          setIsCheckingRole(false);
          return;
        }

        /* Vérifie si l'utilisateur est membre avec rôle relecteur */
        const membre = projet.membres?.find(
          (m: { utilisateurId: number; role: string }) =>
            m.utilisateurId === user.id,
        );

        if (membre) {
          setUserRole(membre.role === "relecteur" ? "relecteur" : "membre");
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Erreur vérification rôle:", err);
        setUserRole(null);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkUserRole();
  }, [token, user?.id, projetId]);

  useEffect(() => {
    if (token && projetId) {
      chargerParProjet(token, projetId);
    }
  }, [token, projetId, chargerParProjet]);

  /*  Gestion des erreurs  */
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const peutValiderRejeter =
    userRole === "createur" || userRole === "relecteur";

  const stats = useMemo(() => {
    return {
      total: livrables.length,
      soumis: livrables.filter((l) => l.statut === "soumis").length,
      valide: livrables.filter((l) => l.statut === "valide").length,
      rejete: livrables.filter((l) => l.statut === "rejete").length,
    };
  }, [livrables]);

  const livrablesFiltres = useMemo(() => {
    let result = livrables;

    if (statutFilter !== "all") {
      result = result.filter((l) => l.statut === statutFilter);
    }

    if (recherche.trim()) {
      const terme = recherche.toLowerCase();
      result = result.filter(
        (l) =>
          l.tache?.titre.toLowerCase().includes(terme) ||
          l.fichierUrl.toLowerCase().includes(terme) ||
          (l.tache?.assignee
            ? `${l.tache.assignee.prenom} ${l.tache.assignee.nom}`
                .toLowerCase()
                .includes(terme)
            : false),
      );
    }

    return result;
  }, [livrables, statutFilter, recherche]);

  const handleValider = async (livrable: Livrable) => {
    if (!token || validatingId !== null) return;

    setValidatingId(livrable.id);
    const ok = await valider(token, livrable.id);
    setValidatingId(null);

    if (ok) {
      toast.success(
        `Livrable validé — la tâche "${livrable.tache?.titre}" est terminée`,
      );
    } else {
    }
  };

  const handleOuvrirRejet = (livrable: Livrable) => {
    setLivrableARejeter(livrable);
    setDialogRejetOpen(true);
  };

  if (isCheckingRole) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          color="#6366F1"
          Icon={FileText}
        />
        <StatCard
          label="En attente"
          value={stats.soumis}
          color="#f59e0b"
          Icon={FileText}
        />
        <StatCard
          label="Validés"
          value={stats.valide}
          color="#10b981"
          Icon={CheckCircle2}
        />
        <StatCard
          label="Rejetés"
          value={stats.rejete}
          color="#ef4444"
          Icon={XCircle}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher (tâche, fichier, auteur)..."
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40"
          />
        </div>

        <div className="flex items-center gap-2 ">
          <div className="flex rounded-md border border-slate-200 bg-white p-1">
            {(
              [
                { key: "all", label: "Tous" },
                { key: "soumis", label: "En attente" },
                { key: "valide", label: "Validés" },
                { key: "rejete", label: "Rejetés" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatutFilter(f.key)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition sm:px-3 ${
                  statutFilter === f.key
                    ? "bg-[#6366F1] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-slate-200/70"
            />
          ))}
        </div>
      ) : livrablesFiltres.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Inbox className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Aucun livrable trouvé
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              {recherche
                ? "Aucun livrable ne correspond à votre recherche."
                : "Aucun livrable n'a encore été soumis pour ce projet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {livrablesFiltres.map((livrable) => {
            const cfg = STATUTS[livrable.statut];
            const Icon = cfg.Icon;
            const isValidating = validatingId === livrable.id;

            return (
              <div
                key={livrable.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#6366F1]/40 hover:shadow "
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        {livrable.tache?.titre ?? "Tâche inconnue"}
                      </h3>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          color: cfg.color,
                          backgroundColor: cfg.soft,
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>

                    <a
                      href={livrable.fichierUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-[#6366F1] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="truncate">{livrable.fichierUrl}</span>
                    </a>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 sm:text-xs">
                      {livrable.tache?.assignee && (
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10">
                            <User className="h-3 w-3 text-[#6366F1]" />
                          </span>
                          <span className="truncate font-medium text-slate-700">
                            {livrable.tache.assignee.prenom}{" "}
                            {livrable.tache.assignee.nom}
                          </span>
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <CalendarDays className="h-3 w-3 text-slate-500" />
                        </span>
                        Soumis le{" "}
                        {new Date(livrable.createdAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>

                    {livrable.statut === "rejete" && livrable.motifRejet && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                        <p className="font-semibold">Motif du rejet :</p>
                        <p className="mt-0.5">{livrable.motifRejet}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {livrable.statut === "soumis" && peutValiderRejeter && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleValider(livrable)}
                          disabled={isValidating}
                          className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                        >
                          {isValidating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Valider
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOuvrirRejet(livrable)}
                          className="h-8 gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Rejeter
                        </Button>
                      </>
                    )}

                    {livrable.statut === "soumis" && !peutValiderRejeter && (
                      <span className="inline-flex h-8 items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-700">
                        En attente de validation
                      </span>
                    )}

                    {livrable.statut === "valide" && (
                      <span className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Accepté
                      </span>
                    )}

                    {livrable.statut === "rejete" && (
                      <span className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-600">
                        <XCircle className="h-3 w-3" />
                        Refusé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {livrableARejeter && (
        <RejeterLivrableDialog
          livrableId={livrableARejeter.id}
          tacheTitre={livrableARejeter.tache?.titre ?? ""}
          open={dialogRejetOpen}
          onOpenChange={(open) => {
            setDialogRejetOpen(open);
            if (!open) setLivrableARejeter(null);
          }}
          onRejected={() => {
            if (token && projetId) {
              chargerParProjet(token, projetId);
            }
          }}
        />
      )}
    </div>
  );
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
  Icon: typeof FileText;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 sm:text-xs">{label}</p>
        <p className="text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}
