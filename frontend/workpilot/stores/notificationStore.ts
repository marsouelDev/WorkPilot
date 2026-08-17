import { create } from "zustand";

export interface NotificationItem {
  id: number;
  titre: string;
  description: string;
  date: string;
  lu: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  markRead: (id: number) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: 1,
      titre: "Nouvelle tâche assignée",
      description: "« Refonte de la page login » vous a été assignée.",
      date: "il y a 5 min",
      lu: false,
    },
    {
      id: 2,
      titre: "Commentaire sur votre tâche",
      description: "Amaan a commenté « API authentification ».",
      date: "il y a 1 h",
      lu: false,
    },
    {
      id: 3,
      titre: "Projet mis à jour",
      description: "Le projet « WorkPilot » est passé en phase de test.",
      date: "hier",
      lu: true,
    },
  ],

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, lu: true } : n,
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, lu: true })),
    })),
}));
