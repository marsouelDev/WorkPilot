"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Calendar } from "lucide-react";

import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

/* ============================================================
   ICÔNE GITHUB OFFICIELLE (SVG inline)
   lucide-react n'expose plus "Github" dans les versions récentes
============================================================ */

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function GithubConnect() {
  const { user, getProfile, connectGithub, isConnectingGithub } =
    useAuthStore();

  /* ==========================================================
     CAPTURE DU STATUT AU PREMIER RENDER
  ========================================================== */

  const [statutInitial] = useState<"ok" | "erreur" | null>(() => {
    if (typeof window === "undefined") return null;

    const statut = new URLSearchParams(window.location.search).get("github");

    if (statut === "ok" || statut === "erreur") return statut;

    return null;
  });

  /* ==========================================================
     EFFET : nettoyer l'URL + recharger le profil si OK
  ========================================================== */

  useEffect(() => {
    if (!statutInitial) return;

    window.history.replaceState({}, "", window.location.pathname);

    if (statutInitial === "ok") {
      getProfile();
    }
  }, [statutInitial, getProfile]);

  /* ==========================================================
     CLIC SUR LE BOUTON
  ========================================================== */

  const handleConnect = async () => {
    try {
      await connectGithub();
    } catch (err) {
      console.error(err);
    }
  };

  /* ==========================================================
     DÉJÀ CONNECTÉ → BADGE VERT
  ========================================================== */

  if (user?.githubUsername) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <GithubIcon className="h-4 w-4 text-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-700">
              GitHub connecté
            </p>

            <p className="truncate text-xs text-emerald-600">
              @{user.githubUsername}
            </p>
          </div>

          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        </div>

        {user.githubLieAt && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Connecté depuis le{" "}
            {new Date(user.githubLieAt).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>
    );
  }

  /* ==========================================================
     PAS CONNECTÉ → BOUTON DE CONNEXION
  ========================================================== */

  return (
    <div className="space-y-2">
      {statutInitial === "erreur" && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          La connexion GitHub a échoué. Réessayez.
        </p>
      )}

      <Button
        type="button"
        onClick={handleConnect}
        disabled={isConnectingGithub}
        className="w-full bg-[#24292f] text-white hover:bg-[#24292f]/90"
      >
        {isConnectingGithub ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirection vers GitHub...
          </>
        ) : (
          <>
            <GithubIcon className="mr-2 h-4 w-4" />
            Connecter mon compte GitHub
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Liez votre compte GitHub pour être invité automatiquement sur les dépôts
        de vos projets.
      </p>
    </div>
  );
}
