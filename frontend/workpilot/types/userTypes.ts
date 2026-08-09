export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  roleGlobal: "admin" | "membre";
  statut: "actif" | "suspendu" | "en_attente_verification";
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

export interface UserState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  createUserByAdmin: (data: CreateUserByAdminFormData) => Promise<void>;
  getUsers: () => Promise<void>;
  getUser: (id: number) => Promise<void>;
  changeStatus: (id: number, statut: User["statut"]) => Promise<void>;
  clearError: () => void;
}
