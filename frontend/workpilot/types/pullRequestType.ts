export type StatutPullRequest = "ouverte" | "fusionnee" | "rejetee";

export interface AuteurPr {
  id: number;
  nom: string;
  prenom: string;
}

export interface ProjetPr {
  id: number;
  titre: string;
  createurId: number;
}

export interface TachePr {
  id: number;
  titre: string;
  statut: string;
  projet?: ProjetPr;
  assignee?: AuteurPr | null;
}

export interface PullRequest {
  id: number;
  tacheId: number;
  url: string;
  numero: number;
  branche: string;
  statut: StatutPullRequest;
  createdAt: string;
  tache?: TachePr;
  auteur?: AuteurPr | null;
  canMerge?: boolean;
}

export type ScopePr =
  | "mes-pr"
  | "mes-projets"
  | `projet/${number}`
  | `tache/${number}`;

export interface PullRequestState {
  pullRequests: PullRequest[];
  isLoading: boolean;
  error: string | null;
  scopeActif: string;

  charger: (token: string, scope: string) => Promise<void>;
  fusionner: (token: string, prId: number) => Promise<boolean>;
  rejeter: (token: string, prId: number, motif: string) => Promise<boolean>;  // ✅
  clearError: () => void;
}



