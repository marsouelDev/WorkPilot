export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  roleGlobal: "admin" | "membre";
  statut: "actif" | "suspendu" | "en_attente_verification";
  githubUsername?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserByAdminFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "admin" | "membre";
}

export interface UpdateUserByAdminFormData {
  nom: string;
  prenom: string;
  telephone: string;
}

export interface UserState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  createUserByAdmin: (data: CreateUserByAdminFormData) => Promise<void>;
  getUsers: () => Promise<void>;
  getUser: (id: number) => Promise<void>;
  updateUserAdmin: (
    id: number,
    data: UpdateUserByAdminFormData,
  ) => Promise<void>;
  changeStatus: (id: number, statut: User["statut"]) => Promise<void>;
  clearError: () => void;
}
