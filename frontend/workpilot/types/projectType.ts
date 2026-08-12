export enum RoleProjet {
  chef_projet = "chef_projet",
  developpeur = "developpeur",
  relecteur = "relecteur",
}

export enum StatutTache {
  disponible = "disponible",
  attribuee = "attribuee",
  en_revue = "en_revue",
  retiree = "retiree",
  terminee = "terminee",
}

export interface ProjetResponse {
  projet: Projet;
  cahierDesCharges: CahierDesChargesResponse | null;
  taches: Tache[];
  generationReussie: boolean;
}

export interface CreateProjectDto {
  titre: string;
  description: string;
  depotGitUrl?: string;
}

export type RoleMembre = "chef_projet" | "developpeur" | "relecteur";
export interface InviteMemberDto {
  email: string;
  role: RoleMembre;
}

export interface ChangeRoleDto {
  role: RoleMembre;
}

export interface Utilisateur {
  id: number;
  email: string;
  username?: string;
}
export interface CahierDesCharges {
  id: number;
  projetId: number;
  contenuGenere: string;
  dateGeneration: string;
}

export interface CahierDesChargesResponse {
  projet: {
    id: number;
    titre: string;
    descriptionSommaire: string;
  };

  cahierDesCharges: {
    id: number;
    contenuGenere: string;
    dateGeneration: string;
  };
}

export interface Tache {
  id: number;
  projetId: number;
  titre: string;
  descriptionGeneree: string;
  statut: StatutTache;
  assigneeId: number | null;
  echeance: string | null;
  createdAt: string;
  updatedAt: string;
  competences: string[];
  complexite: "faible" | "moyenne" | "élevée";
  assignee: Assignee | null;
}

export interface TachesProjetResponse {
  projetId: number;
  nombreTaches: number;
  taches: Tache[];
}

export interface Membre {
  id: number;
  projetId: number;
  utilisateurId: number;
  role: RoleProjet;
  dateAjout: string;
  utilisateur?: Utilisateur;
}

export interface Projet {
  id: number;
  titre: string;
  descriptionSommaire: string;
  depotGitUrl: string | null;
  createurId: number;
  createdAt: string;
  updatedAt: string;
  createur?: Utilisateur;
  cahierDesCharges?: CahierDesCharges | null;
  taches?: Tache[];
  membres?: Membre[];
}

export interface Assignee {
  id: number;
  nom: string;
  prenom: string;
}

export interface UtilisateurRecherche {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
}

export interface MembreProjet {
  id: number;
  projetId: number;
  utilisateurId: number;
  role: RoleMembre;

  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
  };
}

export interface ProjectState {
  projets: Projet[];
  projet: Projet | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  cahierDesCharges: CahierDesChargesResponse | null;
  isLoadingCahierDesCharges: boolean;
  cahierDesChargesError: string | null;
  tachesProjet: Tache[];
  nombreTachesProjet: number;
  isLoadingTachesProjet: boolean;
  tachesProjetError: string | null;
  membres: MembreProjet[];
  isLoadingMembres: boolean;
  erreurMembres: string | null;
  getProjectsAll: (token: string) => Promise<Projet[]>;
  getProject: (token: string, projetId: number) => Promise<Projet>;
  createProject: (
    token: string,
    data: CreateProjectDto,
  ) => Promise<ProjetResponse>;

  removeProject: (token: string, projetId: number) => Promise<void>;
  regenerateCahier: (
    token: string,
    projetId: number,
  ) => Promise<CahierDesChargesResponse>;
  inviteMember: (
    token: string,
    projetId: number,
    data: InviteMemberDto,
  ) => Promise<ProjetResponse>;
  changeMemberRole: (
    token: string,
    projetId: number,
    membreId: number,
    data: ChangeRoleDto,
  ) => Promise<ProjetResponse>;
  removeMember: (
    token: string,
    projetId: number,
    utilisateurId: number,
  ) => Promise<ProjetResponse>;
  getSystemProjects: (token: string) => Promise<Projet[]>;
  listerTachesDuProjet: (
    projetId: number,
    token: string,
  ) => Promise<TachesProjetResponse>;
  getCahierDesCharges: (
    projetId: number,
    token: string,
  ) => Promise<CahierDesChargesResponse>;
  listerMembresProjet: (token: string, projetId: number) => Promise<void>;
  clearError: () => void;
  clearProject: () => void;
  clearCahierDesCharges: () => void;
}
