"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ✅ IMPORTANT : socket.io se connecte à la RACINE du serveur,
   PAS au préfixe /api de NestJS */
const SOCKET_URL = API_URL.replace(/\/api$/, "");

export function useNotificationSocket() {
  const token = useAuthStore((s) => s.token);
  const ajouterEnDirect = useNotificationStore((s) => s.ajouterEnDirect);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket connecté :", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket erreur :", err.message);
    });

    socket.on("nouvelle-notification", (notification) => {
      console.log("Notification reçue en direct :", notification);
      ajouterEnDirect(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, ajouterEnDirect]);
}