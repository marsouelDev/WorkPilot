"use client";

import { useEffect } from "react";
import {
  LucideIcon,
  BellRing,
  CheckCheck,
  Inbox,
  FolderPlus,
  UserCog,
  UserMinus,
  ClipboardList,
  Info,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

const CONFIG_TYPES: Record<string, { icon: LucideIcon; classes: string }> = {
  invitation_projet: {
    icon: FolderPlus,
    classes: "bg-[#6366F1]/10 text-[#6366F1]",
  },
  changement_role: {
    icon: UserCog,
    classes: "bg-amber-500/10 text-amber-600",
  },
  retrait_projet: {
    icon: UserMinus,
    classes: "bg-red-500/10 text-red-600",
  },
  tache_assignee: {
    icon: ClipboardList,
    classes: "bg-emerald-500/10 text-emerald-600",
  },
  tache_terminee: {
    icon: CheckCheck,
    classes: "bg-emerald-500/10 text-emerald-600",
  },
  systeme: {
    icon: Info,
    classes: "bg-slate-500/10 text-slate-600",
  },
};

function tempsRelatif(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;

  const jours = Math.floor(heures / 24);
  return `il y a ${jours} j`;
}

export default function NotificationsPage() {
  const { user, token } = useAuthStore();
  useNotificationSocket();

  const {
    notifications,
    nonLues,
    isLoading,
    charger,
    marquerLue,
    toutMarquerLues,
    supprimer,
  } = useNotificationStore();

  useEffect(() => {
    if (token) charger(token);
  }, [token, charger]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BellRing className="h-6 w-6" />
            Notifications
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {nonLues > 0
              ? `${nonLues} notification${nonLues > 1 ? "s" : ""} non lue${nonLues > 1 ? "s" : ""}`
              : "Vous êtes à jour"}
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {user.prenom} {user.nom}
              </p>

              <p className="text-xs text-muted-foreground">
                {user.role === "admin" ? "Administrateur" : "Membre"}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-sm font-semibold text-primary-foreground">
              {user.prenom?.charAt(0).toUpperCase()}
              {user.nom?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {nonLues > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoading}
            onClick={() => token && toutMarquerLues(token)}
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />

            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />

            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const config =
              CONFIG_TYPES[notification.type] ?? CONFIG_TYPES.systeme;

            const Icone = config.icon;

            return (
              <div
                key={notification.id}
                onClick={() => token && marquerLue(token, notification.id)}
                className={`group flex cursor-pointer items-start gap-3 px-4 py-4 transition hover:bg-muted/60 ${
                  index > 0 ? "border-t" : ""
                } ${notification.lue ? "" : "bg-primary/5"}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.classes}`}
                >
                  <Icone className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm ${
                        notification.lue
                          ? "text-muted-foreground"
                          : "font-semibold text-foreground"
                      }`}
                    >
                      {notification.titre}
                    </p>

                    {!notification.lue && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#6366F1]" />
                    )}
                  </div>

                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {notification.message}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {tempsRelatif(notification.createdAt)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (token) supprimer(token, notification.id);
                  }}
                  className="invisible rounded p-1 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 group-hover:visible"
                  aria-label="Supprimer la notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
