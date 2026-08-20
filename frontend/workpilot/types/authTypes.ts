export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoadingProfile: boolean;
  isUpdating: boolean;
  error: string | null;
  hasHydrated: boolean;
  isConnectingGithub: boolean; 
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  verifyCode: (data: VerifyCodeFormData) => Promise<void>;
  resendCode: (data: ResendCodeFormData) => Promise<void>;
  getProfile: () => Promise<void>;
  updateUser: (data: UpdateProfileFormData) => Promise<void>;
  changePassword: (data: ChangePasswordFormData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
  setHasHydrated: (value: boolean) => void;
  connectGithub: () => Promise<void>;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "admin" | "membre";
  statut: "en_attente_verification" | "actif" | "suspendu";
  createdAt: string;
  updatedAt: string;
  githubUsername?: string | null;
  githubLieAt?: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  confirmationMotDePasse: string;
}
export interface CreateUserByAdminFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "admin" | "membre";
}
export type RegisterPayload = Omit<RegisterFormData, "confirmationMotDePasse">;

export interface VerifyCodeFormData {
  email: string;
  code: string;
}

export interface UpdateProfileFormData {
  nom: string;
  prenom: string;
  telephone: string;
}

export interface ChangePasswordFormData {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface ResendCodeFormData {
  email: string;
}
