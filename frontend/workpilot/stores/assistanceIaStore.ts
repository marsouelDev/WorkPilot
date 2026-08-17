import { create } from "zustand";

import {
  obtenirMessagesTacheIA,
  obtenirTacheIA,
  envoyerMessageIA,
} from "@/services/assistanceIaService";

import type { MessageIA, AssistanceIaState } from "@/types/assistanceIaType";

export const useAssistanceIaStore = create<AssistanceIaState>((set) => ({
  task: null,
  messages: [],
  conversationId: null,

  isLoadingTask: false,
  isSending: false,
  error: null,

  chargerTache: async (token, taskId) => {
    set({
      task: null,
      messages: [],
      conversationId: null,
      isLoadingTask: true,
      error: null,
    });

    try {
      /**
       * Charger les informations de la tâche
       */
      const task = await obtenirTacheIA(token, taskId);

      /**
       * Charger la conversation de CETTE tâche
       */
      const conversation = await obtenirMessagesTacheIA(token, taskId);

      /**
       * Mettre à jour le store avec uniquement
       * les données de cette tâche
       */
      set({
        task,
        messages: conversation.messages,
        conversationId: conversation.conversationId,
        isLoadingTask: false,
        error: null,
      });
    } catch (error) {
      set({
        task: null,
        messages: [],
        conversationId: null,
        isLoadingTask: false,

        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger l'assistance IA.",
      });
    }
  },

  /**
   * ==========================================================
   * ENVOYER UN MESSAGE
   * ==========================================================
   */
  envoyerMessage: async (token, taskId, message) => {
    set({
      isSending: true,
      error: null,
    });

    /**
     * Message utilisateur temporaire
     */
    const messageUtilisateur: MessageIA = {
      id: Date.now(),
      conversationId: 0,
      role: "utilisateur",
      contenu: message,
      createdAt: new Date().toISOString(),
    };

    /**
     * Afficher immédiatement le message
     */
    set((state) => ({
      messages: [...state.messages, messageUtilisateur],
    }));

    try {
      const result = await envoyerMessageIA(token, taskId, message);

      /**
       * Message de l'IA
       */
      const messageAssistant: MessageIA = {
        id: result.message.id,
        conversationId: result.conversationId,
        role: "assistant",
        contenu: result.message.contenu,
        createdAt: result.message.createdAt,
      };

      /**
       * Ajouter la réponse IA
       */
      set((state) => ({
        messages: [...state.messages, messageAssistant],

        conversationId: result.conversationId,

        isSending: false,
        error: null,
      }));
    } catch (error) {
      /**
       * En cas d'erreur, on peut retirer
       * le message temporaire utilisateur.
       */
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg.id !== messageUtilisateur.id,
        ),

        isSending: false,

        error:
          error instanceof Error
            ? error.message
            : "Impossible de contacter l'IA.",
      }));
    }
  },

  /**
   * ==========================================================
   * EFFACER ERREUR
   * ==========================================================
   */
  clearError: () => {
    set({
      error: null,
    });
  },

  /**
   * ==========================================================
   * RESET
   * ==========================================================
   */
  reset: () => {
    set({
      task: null,
      messages: [],
      conversationId: null,
      isLoadingTask: false,
      isSending: false,
      error: null,
    });
  },
}));
