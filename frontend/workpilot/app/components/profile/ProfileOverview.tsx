"use client";

import { useEffect } from "react";
import { Shield, UserRound, CheckCircle2, Calendar } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import GithubConnect from "../github/GithubConnect";

export default function ProfileOverview() {
  const { user, getProfile, isLoadingProfile } = useAuthStore();

  useEffect(() => {
    if (!user) {
      getProfile();
    }
  }, [user, getProfile]);

  if (isLoadingProfile || !user) {
    return (
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="flex items-center gap-5 p-6">
          <Skeleton className="h-20 w-20 rounded-full" />

          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const initiales =
    `${user.prenom?.charAt(0) ?? ""}${user.nom?.charAt(0) ?? ""}`.toUpperCase();

  const dateInscription = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isActif = user.statut === "actif";
  const isAdmin = user.role === "admin";

  return (
    <Card className="overflow-hidden shadow-sm">
      <style>{`
        @keyframes wp-profile-card-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wp-avatar-pop {
          0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          60% { opacity: 1; transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes wp-badge-in {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes wp-text-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wp-status-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }

        /* NOUVELLES ANIMATIONS — SECTION GITHUB */

        @keyframes wp-divider-in {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
        @keyframes wp-section-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wp-github-in {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .wp-profile-card-in { animation: wp-profile-card-in .5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .wp-avatar-pop { animation: wp-avatar-pop .6s cubic-bezier(0.34, 1.56, 0.64, 1) .15s both; }
        .wp-badge-in { animation: wp-badge-in .4s cubic-bezier(0.16, 1, 0.3, 1) .3s both; }
        .wp-text-in { animation: wp-text-in .4s cubic-bezier(0.16, 1, 0.3, 1) .25s both; }
        .wp-text-in-2 { animation: wp-text-in .4s cubic-bezier(0.16, 1, 0.3, 1) .35s both; }
        .wp-status-dot-pulse { animation: wp-status-dot-pulse 2s ease-in-out infinite; }
        .wp-avatar-hover:hover { transform: scale(1.05) rotate(2deg); }
        .wp-divider-in {
          transform-origin: left;
          animation: wp-divider-in .6s cubic-bezier(0.16, 1, 0.3, 1) .4s both;
        }
        .wp-section-in {
          animation: wp-section-in .5s cubic-bezier(0.16, 1, 0.3, 1) .5s both;
        }
        .wp-github-in {
          animation: wp-github-in .5s cubic-bezier(0.16, 1, 0.3, 1) .6s both;
        }
      `}</style>

      <CardContent className="wp-profile-card-in p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

          <div className="relative hidden w-fit shrink-0 sm:block">
            <div className="wp-avatar-pop wp-avatar-hover flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#6366F1] to-[#8B5CF6] text-2xl font-bold text-white shadow-lg ring-4 ring-white transition-transform duration-300 ease-out">
              {initiales}
            </div>

            {isActif && (
              <span className="wp-avatar-pop absolute -right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-500 sm:bottom-0 sm:right-0 sm:top-auto sm:translate-y-0">
                <span className="wp-status-dot-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <CheckCircle2 className="relative h-3 w-3 text-white" />
              </span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="wp-text-in flex flex-wrap items-center gap-2">
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "#0F172A" }}
              >
                {user.prenom} {user.nom}
              </h1>

              <Badge
                variant="outline"
                className={
                  isAdmin
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-[#6366F1]/30 bg-[#6366F1]/5 text-[#6366F1]"
                }
              >
                {isAdmin ? (
                  <Shield className="mr-1 h-3 w-3" />
                ) : (
                  <UserRound className="mr-1 h-3 w-3" />
                )}
                {isAdmin ? "Administrateur" : "Membre"}
              </Badge>
            </div>

            <p className="wp-text-in-2 text-sm text-muted-foreground">
              {user.email}
            </p>

            {dateInscription && (
              <p className="wp-badge-in flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Utilisateur depuis {dateInscription}
              </p>
            )}
          </div>

          <div className="wp-badge-in sm:text-right">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                isActif
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`wp-status-dot-pulse h-2 w-2 rounded-full ${
                  isActif ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {isActif ? "Compte actif" : "Compte suspendu"}
            </div>
          </div>
        </div>

        <div className="wp-divider-in mt-6 h-px bg-border" />
{user?.role === "admin" ? (
  <div className="wp-section-in pt-5">
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-400">
      <p className="font-medium">Mode Administrateur</p>
      <p className="mt-1 text-xs">
        Les intégrations GitHub ne sont pas nécessaires pour votre compte
        administrateur.
      </p>
    </div>
  </div>
) : (
  <div className="wp-section-in pt-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "#0F172A" }}>
          Intégrations
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Connectez votre compte GitHub pour être invité automatiquement
          sur les dépôts de vos projets.
        </p>
      </div>
      <div className="wp-github-in w-full sm:w-72">
        <GithubConnect />
      </div>
    </div>
  </div>
)}
      </CardContent>
    </Card>
  );
}
