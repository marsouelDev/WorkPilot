"use client";

import { create } from "zustand";
import { notificationServices } from "@/services/notificationService";
import type { NotificationApi } from "@/types/notificationType";
import type { NotificationState } from "@/types/notificationType";
export type { NotificationApi };

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  nonLues: 0,
  isLoading: false,
  error: null,

  charger: async (token) => {
    set({ isLoading: true, error: null });

    try {
      const data = await notificationServices.lister(token);

      set({
        notifications: data.notifications,
        nonLues: data.nonLues,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erreur inconnue",
        isLoading: false,
      });
    }
  },

  marquerLue: async (token, id) => {
    const etaitLue = get().notifications.find((n) => n.id === id)?.lue;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, lue: true } : n,
      ),
      nonLues: etaitLue ? state.nonLues : Math.max(0, state.nonLues - 1),
    }));

    try {
      await notificationServices.marquerLue(token, id);
    } catch (err) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, lue: etaitLue ?? false } : n,
        ),
        nonLues: etaitLue ? state.nonLues : state.nonLues + 1,
        error: err instanceof Error ? err.message : "Erreur",
      }));
    }
  },

  toutMarquerLues: async (token) => {
    const ancienEtat = get().notifications.map((n) => ({
      id: n.id,
      lue: n.lue,
    }));

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, lue: true })),
      nonLues: 0,
    }));

    try {
      await notificationServices.toutMarquerLues(token);
    } catch (err) {
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          lue: ancienEtat.find((a) => a.id === n.id)?.lue ?? false,
        })),
        nonLues: ancienEtat.filter((a) => !a.lue).length,
        error: err instanceof Error ? err.message : "Erreur",
      }));
    }
  },

  supprimer: async (token, id) => {
    const ancienne = get().notifications.find((n) => n.id === id);

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      nonLues:
        ancienne && !ancienne.lue
          ? Math.max(0, state.nonLues - 1)
          : state.nonLues,
    }));

    try {
      await notificationServices.supprimer(token, id);
    } catch (err) {
      if (ancienne) {
        set((state) => ({
          notifications: [...state.notifications, ancienne],
          nonLues: !ancienne.lue ? state.nonLues + 1 : state.nonLues,
          error: err instanceof Error ? err.message : "Erreur",
        }));
      }
    }
  },

  /** Ajoute une notification (temps réel WebSocket ou autre) en tête de liste */
  ajouterEnDirect: (notification: NotificationApi) => {
    set((state) => {
      /* Évite les doublons par ID */
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }

      return {
        notifications: [notification, ...state.notifications].slice(0, 50),
        nonLues: notification.lue ? state.nonLues : state.nonLues + 1,
      };
    });
  },

  clearError: () => set({ error: null }),
}));
