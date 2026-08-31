"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { useAuthStore } from "./authStore";
import type {
  UserState,
  CreateUserByAdminFormData,
  UpdateUserByAdminFormData,
} from "@/types/userTypes";

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  clearError: () => set({ error: null }),

  createUserByAdmin: async (data: CreateUserByAdminFormData) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      await userService.createByAdmin(data, token);
      set({ isLoading: false });
      toast.success("Utilisateur créé avec succès");
      await get().getUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getUsers: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const users = await userService.getAll(token);
      set({ users, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getUser: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const user = await userService.getOne(id, token);
      set({ selectedUser: user, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateUserAdmin: async (id: number, data: UpdateUserByAdminFormData) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("Vous devez être connecté.");
      return;
    }

    set({ isUpdating: true, error: null });
    try {
      const updatedUser = await userService.updateByAdmin(id, data, token);

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        selectedUser:
          state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        isUpdating: false,
      }));

      toast.success("Utilisateur mis à jour avec succès");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur de mise à jour";
      set({ error: message, isUpdating: false });
      toast.error(message);
      throw error;
    }
  },

  changeStatus: async (id, statut) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("Vous devez être connecté.");
      return;
    }

    set({ isUpdating: true, error: null });
    try {
      const updatedUser = await userService.changeStatus(id, statut, token);

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        selectedUser:
          state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        isUpdating: false,
      }));
      toast.success("Statut mis à jour");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue.";
      set({ error: message, isUpdating: false });
      toast.error(message);
    }
  },
}));
