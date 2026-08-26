"use client";

import { create } from "zustand";
import type { Livrable, LivrableState } from "@/types/livrableType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useLivrableStore = create<LivrableState>((set, get) => ({
  livrable: null,
  livrables: [],
  isLoading: false,
  error: null,

  charger: async (token, tacheId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/livrables/tache/${tacheId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) {
          set({ livrable: null, isLoading: false });
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as Livrable;
      set({ livrable: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erreur",
        isLoading: false,
      });
    }
  },

  chargerParProjet: async (token, projetId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/livrables/projet/${projetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as Livrable[];
      set({ livrables: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erreur",
        isLoading: false,
      });
    }
  },

  soumettre: async (token, tacheId, fichierUrl) => {
    try {
      const res = await fetch(`${API_URL}/livrables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tacheId, fichierUrl }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }

      await get().charger(token, tacheId);
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erreur",
      });
      return false;
    }
  },

  valider: async (token, livrableId) => {
    try {
      const res = await fetch(`${API_URL}/livrables/${livrableId}/valider`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }

      set({ livrable: null });
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erreur",
      });
      return false;
    }
  },

  rejeter: async (token, livrableId, motif) => {
    try {
      const res = await fetch(`${API_URL}/livrables/${livrableId}/rejeter`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ motif }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }

      set({ livrable: null });
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erreur",
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
