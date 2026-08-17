import { create } from "zustand";
import { choisirTache as choisirTacheService } from "@/services/tacheService";
import type { Tache } from "@/types/projectType";

interface TaskStore {
  taches: Tache[];
  isChoosingTask: boolean;
  error: string | null;
  choisirTache: (token: string, tacheId: number) => Promise<Tache>;
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  taches: [],
  isChoosingTask: false,
  error: null,
  choisirTache: async (token: string, tacheId: number): Promise<Tache> => {
    set({
      isChoosingTask: true,
      error: null,
    });

    try {
      const tacheModifiee = await choisirTacheService(token, tacheId);

      set((state) => ({
        taches: state.taches.map((tache) =>
          tache.id === tacheModifiee.id ? tacheModifiee : tache,
        ),

        isChoosingTask: false,
        error: null,
      }));

      return tacheModifiee;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de choisir cette tâche.";

      set({
        isChoosingTask: false,
        error: message,
      });

      throw error;
    }
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));
