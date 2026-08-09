"use client";

import { create } from "zustand";
import { userService } from "@/services/userService";
import { useAuthStore } from "./authStore";
import type { UserState, CreateUserByAdminFormData } from "@/types/userTypes";
import { toast } from "sonner";

export const useUserStore = create<UserState>((set) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  createUserByAdmin: async (data: CreateUserByAdminFormData) => {
    const token = useAuthStore.getState().token;

    if (!token) return;
    set({
      isLoading: true,
      error: null,
    });

    try {
      await userService.createByAdmin(data, token);

      set({
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erreur",

        isLoading: false,
      });

      throw error;
    }
  },

  getUsers: async () => {
    const token = useAuthStore.getState().token;

    if (!token) return;

    set({
      isLoading: true,
      error: null,
    });

    try {
      const users = await userService.getAll(token);

      set({
        users,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erreur",

        isLoading: false,
      });

      throw error;
    }
  },

  getUser: async (id: number) => {
    const token = useAuthStore.getState().token;

    if (!token) return;

    set({
      isLoading: true,
      error: null,
    });

    try {
      const user = await userService.getOne(id, token);

      set({
        selectedUser: user,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erreur",

        isLoading: false,
      });

      throw error;
    }
  },

  changeStatus: async (id, statut) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("Vous devez être connecté.");
      return;
    }

    set({
      isUpdating: true,
      error: null,
    });

    try {
      const updatedUser = await userService.changeStatus(id, statut, token);

      set((state) => ({
        users: state.users.map((user) => (user.id === id ? updatedUser : user)),

        selectedUser:
          state.selectedUser?.id === id ? updatedUser : state.selectedUser,

        isUpdating: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue.";

      set({
        isUpdating: false,
      });

      toast.error(message);

      return;
    }
  },
  clearError: () =>
    set({
      error: null,
    }),
}));
