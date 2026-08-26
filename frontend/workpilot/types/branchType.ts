export interface BranchCommit {
  sha: string;
  message: string;
  auteur: string;
  date: string;
}

export interface BranchDetaillee {
  name: string;
  protected: boolean;
  commit: BranchCommit;
  isDefault: boolean;
  behindAhead?: {
    behind: number;
    ahead: number;
  };
}

export type BranchFilter = "all" | "actives" | "stale";

export interface BranchState {
  branches: BranchDetaillee[];
  isLoading: boolean;
  error: string | null;
  projetIdActif: number | null;

  charger: (token: string, projetId: number) => Promise<void>;
  recharger: (token: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}
