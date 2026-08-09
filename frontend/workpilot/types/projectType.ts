export type StatutTache =
  | "disponible"
  | "attribuee"
  | "en_revue"
  | "retiree"
  | "terminee";

export type RoleProjet = "chef_projet" | "developpeur" | "relecteur";

export interface CahierDesCharges {
  id: number;
  projetId: number;
  contenuGenere: string;
  dateGeneration: string;
}

export interface Membre {
  id: number;
  projetId: number;
  utilisateurId: number;
  role: RoleProjet;
  dateAjout: string;
  utilisateur?: UtilisateurProjet;
}

export interface UtilisateurProjet {
  id: number;
  nom?: string;
  prenom?: string;
  email: string;
}

export interface Tache {
  id: number;
  projetId: number;
  titre: string;
  descriptionGeneree: string;
  statut: StatutTache;
  assigneeId: number | null;
  assignee?: UtilisateurProjet | null;
  echeance: string | null;
  createdAt: string;
  updatedAt: string;
  competences: string[];
  complexite: string;
}

export interface Projet {
  id: number;
  titre: string;
  descriptionSommaire: string;
  depotGitUrl: string | null;
  createurId: number;
  createdAt: string;
  updatedAt: string;
  cahierDesCharges?: CahierDesCharges | null;
  taches?: Tache[];
  membres?: Membre[];
}

export interface CreateProjectDto {
  titre: string;
  descriptionSommaire: string;
  depotGitUrl?: string;
}

export interface InviteMemberDto {
  email: string;
}


export interface ChangeRoleDto {
  role: RoleProjet;
}
