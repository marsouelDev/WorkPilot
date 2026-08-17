"use client";

import { BellRing, CheckCheck, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";

export default function NotificationsPage() {
  const { user } = useAuthStore();

  const { notifications, markRead, markAllRead } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.lu).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* ======================================================
          EN-TÊTE + NOM & RÔLE À CÔTÉ
      ====================================================== */}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BellRing className="h-6 w-6" />
            Notifications
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Vous êtes à jour ✅"}
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

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={markAllRead}
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {/* ======================================================
          LISTE COMPLÈTE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />

            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <div
              key={notification.id}
              onClick={() => markRead(notification.id)}
              className={`flex cursor-pointer items-start gap-3 px-4 py-4 transition hover:bg-muted/60 ${
                index > 0 ? "border-t" : ""
              } ${notification.lu ? "" : "bg-primary/5"}`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  notification.lu ? "bg-transparent" : "bg-primary"
                }`}
              />

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    notification.lu
                      ? "text-muted-foreground"
                      : "font-semibold text-foreground"
                  }`}
                >
                  {notification.titre}
                </p>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  {notification.description}
                </p>

                <p className="mt-1 text-xs text-muted-foreground/70">
                  {notification.date}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
