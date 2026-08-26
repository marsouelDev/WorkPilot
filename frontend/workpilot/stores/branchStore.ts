"use client";

import { create } from "zustand";
import type { BranchDetaillee, BranchState } from "@/types/branchType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  isLoading: false,
  error: null,
  projetIdActif: null,

  charger: async (token, projetId) => {
    set({ isLoading: true, error: null, projetIdActif: projetId });

    try {
      const res = await fetch(
        `${API_URL}/projects/${projetId}/branches-detaillees`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(60_000),
        },
      );

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message ?? `Erreur HTTP ${res.status}`);
      }

      const data = (await res.json()) as BranchDetaillee[];
      set({
        branches: Array.isArray(data) ? data : [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erreur inconnue",
        branches: [],
        isLoading: false,
      });
    }
  },

  recharger: async (token) => {
    const { projetIdActif } = get();
    if (!projetIdActif) return;
    await get().charger(token, projetIdActif);
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      branches: [],
      isLoading: false,
      error: null,
      projetIdActif: null,
    }),
}));
