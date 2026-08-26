"use client";

import { create } from "zustand";
import type { PullRequest, PullRequestState } from "@/types/pullRequestType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const usePullRequestStore = create<PullRequestState>((set, get) => ({
  pullRequests: [],
  isLoading: false,
  error: null,
  scopeActif: "mes-projets",

  charger: async (token, scope) => {
    set({ isLoading: true, error: null, scopeActif: scope });

    try {
      const res = await fetch(`${API_URL}/pull-requests/${scope}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message ?? `Erreur HTTP ${res.status}`);
      }

      const data = (await res.json()) as PullRequest[];
      set({
        pullRequests: Array.isArray(data) ? data : [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erreur inconnue",
        pullRequests: [],
        isLoading: false,
      });
    }
  },

  fusionner: async (token, prId) => {
    try {
      const res = await fetch(`${API_URL}/pull-requests/${prId}/fusionner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message ?? `Erreur HTTP ${res.status}`);
      }

      /* Refresh la liste avec le scope actuel */
      await get().charger(token, get().scopeActif);
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Fusion impossible",
      });
      return false;
    }
  },

  rejeter: async (
    token: string,
    prId: number,
    motif: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/pull-requests/${prId}/rejeter`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ motif }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }

      /* ✅ Recharger la liste pour refléter le changement */
      await get().charger(token, get().scopeActif ?? "mes-projets");

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erreur de rejet",
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
