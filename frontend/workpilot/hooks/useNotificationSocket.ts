"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type { NotificationApi } from "@/types/notificationType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const IS_DEV = process.env.NODE_ENV === "development";

/* ==========================================================
   🔌 HOOK WEBSOCKET — Notifications temps réel
========================================================== */
export function useNotificationSocket() {
  const { token, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !API_URL || !user?.id) return;

    const wsUrl = API_URL.replace(/\/api\/?$/, "");
    if (IS_DEV) console.log(`[Socket] 🔄 Connexion à ${wsUrl}`);

    const socket = io(wsUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    socketRef.current = socket;

    /* ======================================================
       🟢 ÉVÉNEMENTS DE CONNEXION
    ====================================================== */
    socket.on("connect", () => {
      if (IS_DEV) console.log(`[Socket] ✅ Connecté (ID: ${socket.id})`);
    });

    socket.on("disconnect", (reason) => {
      if (IS_DEV) console.log(`[Socket] 🔌 Déconnecté : ${reason}`);
      if (reason === "io server disconnect") {
        toast.warning("Connexion perdue", {
          description: "Tentative de reconnexion...",
          duration: 3000,
        });
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      if (IS_DEV) console.warn(`[Socket] ⚠️ Erreur : ${err.message}`);
      if (
        err.message.includes("unauthorized") ||
        err.message.includes("401") ||
        err.message.includes("invalid")
      ) {
        if (IS_DEV) console.warn("[Socket] 🔐 Token invalide, déconnexion");
        socket.disconnect();
        useAuthStore.getState().logout();
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      if (IS_DEV)
        console.log(
          `[Socket] 🔄 Reconnecté après ${attemptNumber} tentative(s)`,
        );
      toast.success("Connexion rétablie", { duration: 2000 });
    });

    socket.on("reconnect_error", (err) => {
      if (IS_DEV)
        console.warn(`[Socket] ❌ Échec reconnexion : ${err.message}`);
    });

    socket.on("reconnect_failed", () => {
      toast.error("Connexion impossible", {
        description:
          "Impossible de se reconnecter au serveur. Rechargez la page.",
        duration: 6000,
      });
    });

    /* ======================================================
       📨 RÉCEPTION DES NOTIFICATIONS TEMPS RÉEL
    ====================================================== */
    socket.on("nouvelle-notification", (notification: NotificationApi) => {
      if (IS_DEV) console.log("[Socket] 📨 Notification reçue", notification);

      /* Toast immédiat avec action cliquable */
      toast.info(notification?.titre ?? "Nouvelle notification", {
        description: notification?.message,
        duration: 5000,
        action: notification?.projetId
          ? {
              label: "Voir",
              onClick: () => {
                window.location.href = `/projects/${notification.projetId}/cahier-des-charges`;
              },
            }
          : undefined,
      });

      /* Mise à jour du store (badge rouge + liste) */
      useNotificationStore.getState().ajouterEnDirect(notification);
    });

    /* ======================================================
       🧹 CLEANUP AU DÉMONTAGE
    ====================================================== */
    return () => {
      if (IS_DEV) console.log("[Socket] 🧹 Nettoyage des listeners");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  return socketRef;
}
