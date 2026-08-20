"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authServices } from "@/services/authService";

import type {
  AuthState,
  User,
  LoginFormData,
  RegisterPayload,
  VerifyCodeFormData,
  ResendCodeFormData,
  UpdateProfileFormData,
  ChangePasswordFormData,
} from "@/types/authTypes";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      hasHydrated: false,

      isLoading: false,
      isLoadingProfile: false,
      isUpdating: false,
      isConnectingGithub: false,

      error: null,

      setHasHydrated: (value: boolean) =>
        set({
          hasHydrated: value,
        }),

      login: async (data: LoginFormData) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const result = await authServices.login(data);

          document.cookie = `token=${result.access_token}; Path=/; Max-Age=604800; SameSite=Lax`;

          set({
            user: result.user,

            token: result.access_token,

            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Une erreur est survenue",

            isLoading: false,
          });

          throw error;
        }
      },

      register: async (data: RegisterPayload) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          await authServices.register(data);

          set({
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Une erreur est survenue",

            isLoading: false,
          });

          throw error;
        }
      },

      verifyCode: async (data: VerifyCodeFormData) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const result = await authServices.verifyCode(data);

          document.cookie = `token=${result.access_token}; Path=/; Max-Age=604800; SameSite=Lax`;

          set({
            user: result.user,

            token: result.access_token,

            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Une erreur est survenue",

            isLoading: false,
          });

          throw error;
        }
      },

      resendCode: async (data: ResendCodeFormData) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          await authServices.resendCode(data);

          set({
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Une erreur est survenue",

            isLoading: false,
          });

          throw error;
        }
      },

      getProfile: async () => {
        const { token } = get();

        if (!token) {
          return;
        }

        set({
          isLoadingProfile: true,
          error: null,
        });

        try {
          const user = await authServices.getProfile(token);

          set({
            user,

            isLoadingProfile: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Une erreur est survenue",

            isLoadingProfile: false,
          });

          throw error;
        }
      },

      updateUser: async (data: UpdateProfileFormData) => {
        const { token } = get();

        if (!token) {
          return;
        }

        set({
          isUpdating: true,

          error: null,
        });

        try {
          const user = await authServices.updateUser(data, token);

          set({
            user,

            isUpdating: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Une erreur est survenue",

            isUpdating: false,
          });

          throw error;
        }
      },

      changePassword: async (data: ChangePasswordFormData) => {
        const { token } = get();

        if (!token) {
          return;
        }

        set({
          isLoading: true,

          error: null,
        });

        try {
          await authServices.changePassword(data, token);

          set({
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Une erreur est survenue",

            isLoading: false,
          });

          throw error;
        }
      },

      connectGithub: async () => {
        const { token } = get();

        if (!token) {
          throw new Error("Vous devez être connecté pour lier GitHub.");
        }

        set({
          isConnectingGithub: true,
          error: null,
        });

        try {

          const { url } = await authServices.getGithubConnectUrl(token);

          window.location.href = url;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Impossible de connecter GitHub.",

            isConnectingGithub: false,
          });

          throw error;
        }
      },

      logout: () => {
        document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";

        set({
          user: null,
          token: null,
          error: null,
          isLoading: false,
          isLoadingProfile: false,
          isUpdating: false,
          isConnectingGithub: false,
        });
      },

      clearError: () =>
        set({
          error: null,
        }),

      setUser: (user: User) =>
        set({
          user,
        }),
    }),

    {
      name: "auth-storage",

      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
