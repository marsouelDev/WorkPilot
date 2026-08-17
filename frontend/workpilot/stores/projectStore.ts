"use client";

import { create } from "zustand";
import type {
  ProjectState,
  CreateProjectDto,
  InviteMemberDto,
  ChangeRoleDto,
} from "@/types/projectType";
import {
  creerProjet,
  listerMesProjets,
  obtenirProjet,
  regenererCahierDesCharges,
  inviterMembre,
  changerRole,
  retirerMembre,
  listerProjetsSysteme,
  supprimerProjet,
  obtenirCahierDesCharges,
  listerTachesDuProjet,
  obtenirMembresProjet,
} from "@/services/projectServices";

export const useProjectStore = create<ProjectState>((set, get) => ({
  projets: [],
  projet: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  cahierDesCharges: null,
  isLoadingCahierDesCharges: false,
  cahierDesChargesError: null,
  tachesProjet: [],
  nombreTachesProjet: 0,
  isLoadingTachesProjet: false,
  tachesProjetError: null,
  membres: [],
  isLoadingMembres: false,
  erreurMembres: null,

  getProjectsAll: async (token: string) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const projets = await listerMesProjets(token);

      set({
        projets,
        isLoading: false,
      });

      return projets;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les projets.";

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  getProject: async (token: string, projetId: number) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const projet = await obtenirProjet(token, projetId);

      set({
        projet,
        isLoading: false,
      });

      return projet;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de récupérer le projet.";

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  createProject: async (token: string, data: CreateProjectDto) => {
    set({
      isCreating: true,
      error: null,
    });

    try {
      const response = await creerProjet(token, data);

      console.log("Réponse création projet :", response);
      console.log("Projet :", response.projet);
      console.log("Projet ID :", response.projet?.id);

      const projet = response.projet;

      if (!projet || !projet.id) {
        throw new Error(
          "Le serveur n'a pas retourné correctement le projet créé.",
        );
      }

      set((state) => ({
        projets: [projet, ...state.projets],
        projet,
        isCreating: false,
      }));

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de créer le projet.";

      set({
        isCreating: false,
        error: message,
      });

      throw error;
    }
  },

  removeProject: async (token: string, projetId: number) => {
    set({
      isUpdating: true,
      error: null,
    });

    try {
      await supprimerProjet(token, projetId);

      set((state) => ({
        projets: state.projets.filter((projet) => projet.id !== projetId),

        projet: state.projet?.id === projetId ? null : state.projet,

        isUpdating: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le projet.";

      set({
        isUpdating: false,
        error: message,
      });

      throw error;
    }
  },

  regenerateCahier: async (token: string, projetId: number) => {
    set({
      isUpdating: true,
      error: null,
    });

    try {
      const data = await regenererCahierDesCharges(token, projetId);
      await get().getCahierDesCharges(projetId, token);

      set({
        isUpdating: false,
        cahierDesChargesError: null,
      });

      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de régénérer le cahier des charges.";

      set({
        isUpdating: false,
        error: message,
        cahierDesChargesError: message,
      });

      throw error;
    }
  },

  inviteMember: async (
    token: string,
    projetId: number,
    data: InviteMemberDto,
  ) => {
    set({
      isUpdating: true,
      error: null,
    });

    try {
      const response = await inviterMembre(token, projetId, data);
      const projet = await obtenirProjet(token, projetId);

      set((state) => ({
        projet,

        projets: state.projets.map((item) =>
          item.id === projet.id ? projet : item,
        ),

        isUpdating: false,
      }));

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d’inviter le membre.";

      set({
        isUpdating: false,
        error: message,
      });

      throw error;
    }
  },

  changeMemberRole: async (
    token: string,
    projetId: number,
    membreId: number,
    data: ChangeRoleDto,
  ) => {
    set({
      isUpdating: true,
      error: null,
    });

    try {
      const response = await changerRole(token, projetId, membreId, data);

      const projet = await obtenirProjet(token, projetId);

      set((state) => ({
        projet,

        projets: state.projets.map((item) =>
          item.id === projet.id ? projet : item,
        ),

        isUpdating: false,
      }));

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de modifier le rôle.";

      set({
        isUpdating: false,
        error: message,
      });

      throw error;
    }
  },

  removeMember: async (
    token: string,
    projetId: number,
    utilisateurId: number,
  ) => {
    set({
      isUpdating: true,
      error: null,
    });

    try {
      const response = await retirerMembre(token, projetId, utilisateurId);

      const projet = await obtenirProjet(token, projetId);

      set((state) => ({
        projet,

        projets: state.projets.map((item) =>
          item.id === projet.id ? projet : item,
        ),

        isUpdating: false,
      }));

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de retirer le membre.";

      set({
        isUpdating: false,
        error: message,
      });

      throw error;
    }
  },

  getSystemProjects: async (token: string) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const projets = await listerProjetsSysteme(token);

      set({
        projets,
        isLoading: false,
      });

      return projets;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les projets du système.";

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  listerTachesDuProjet: async (projetId: number, token: string) => {
    set({
      isLoadingTachesProjet: true,
      tachesProjetError: null,
    });

    try {
      const data = await listerTachesDuProjet(projetId, token);

      set({
        tachesProjet: data.taches,
        nombreTachesProjet: data.nombreTaches,
        isLoadingTachesProjet: false,
      });

      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les tâches du projet.";

      set({
        tachesProjet: [],
        nombreTachesProjet: 0,
        isLoadingTachesProjet: false,
        tachesProjetError: message,
      });

      throw error;
    }
  },

  getCahierDesCharges: async (projetId: number, token: string) => {
    set({
      isLoadingCahierDesCharges: true,
      cahierDesChargesError: null,
    });

    try {
      const data = await obtenirCahierDesCharges(projetId, token);

      set({
        cahierDesCharges: data,
        isLoadingCahierDesCharges: false,
      });

      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de récupérer le cahier des charges.";

      set({
        cahierDesChargesError: message,
        isLoadingCahierDesCharges: false,
      });

      throw error;
    }
  },
  listerMembresProjet: async (token, projetId) => {
    set({
      isLoadingMembres: true,
      erreurMembres: null,
    });

    try {
      const membres = await obtenirMembresProjet(token, projetId);
      console.log("MEMBRES RECUS PAR LE STORE :", membres);

      set({
        membres,
        isLoadingMembres: false,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les membres.";
      console.error("Erreur membres projet :", error);
      set({
        membres: [],
        isLoadingMembres: false,
        erreurMembres: message,
      });

      throw error;
    }
  },

  trouverProjetParId: async (token, projetId) => {
    try {
      const projet = await obtenirProjet(token, projetId);

      set({
        projet,
      });
    } catch (error) {
      console.error("Erreur récupération projet :", error);
    }
  },

  clearError: () => {
    set({
      error: null,
    });
  },

  clearProject: () => {
    set({
      projet: null,
    });
  },

  clearTasks: () => {
    set({
      tachesProjet: [],
      nombreTachesProjet: 0,
      tachesProjetError: null,
    });
  },

  clearCahierDesCharges: () => {
    set({
      cahierDesCharges: null,
      cahierDesChargesError: null,
    });
  },
}));
