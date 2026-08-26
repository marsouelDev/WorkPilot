"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type { NotificationApi } from "@/types/notificationType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useNotificationSocket() {
  const { token, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !API_URL || !user?.id) return;

    const wsUrl = API_URL.replace(/\/api\/?$/, "");
    console.log(`[Socket] 🔄 Connexion à ${wsUrl}`);

    const socket = io(wsUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Socket] ✅ Connecté (ID: ${socket.id})`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] 🔌 Déconnecté : ${reason}`);
    });

    let warned = false;
    socket.on("connect_error", (err) => {
      if (!warned) {
        warned = true;
        console.warn(`[Socket] ⚠️ Erreur : ${err.message}`);
      }
    });

    /* ✅ Réception temps réel : toast + mise à jour du store via ajouterEnDirect */
    socket.on("nouvelle-notification", (notification: NotificationApi) => {
      console.log("[Socket] 📨 Notification reçue", notification);

      /* 1. Toast immédiat */
      toast.info(notification?.titre ?? "Nouvelle notification", {
        description: notification?.message,
        duration: 5000,
      });

      /* 2. ✅ Mise à jour du store (badge rouge + liste) */
      useNotificationStore.getState().ajouterEnDirect(notification);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  return socketRef;
}
