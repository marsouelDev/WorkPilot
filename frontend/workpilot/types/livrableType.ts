export type StatutLivrable = "soumis" | "valide" | "rejete";

export interface Livrable {
  id: number;
  tacheId: number;
  fichierUrl: string;
  statut: StatutLivrable;
  motifRejet?: string | null;
  createdAt: string;
  updatedAt: string;
  tache?: {
    id: number;
    titre: string;
    statut: string;
    projetId: number;
    assignee?: {
      id: number;
      prenom: string;
      nom: string;
    };
  };
}

export interface LivrableState {
  livrable: Livrable | null;
  livrables: Livrable[];
  isLoading: boolean;
  error: string | null;

  charger: (token: string, tacheId: number) => Promise<void>;
  chargerParProjet: (token: string, projetId: number) => Promise<void>;
  soumettre: (
    token: string,
    tacheId: number,
    fichierUrl: string,
  ) => Promise<boolean>;
  valider: (token: string, livrableId: number) => Promise<boolean>;
  rejeter: (
    token: string,
    livrableId: number,
    motif: string,
  ) => Promise<boolean>;
  clearError: () => void;
}
