export interface NotificationApi {
  id: number;
  titre: string;
  message: string;
  type: string;
  lue: boolean;
  projetId: number | null;
  tacheId: number | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationApi[];
  nonLues: number;
}

export interface NotificationState {
  notifications: NotificationApi[];
  nonLues: number;
  isLoading: boolean;
  error: string | null;

  charger: (token: string) => Promise<void>;
  marquerLue: (token: string, id: number) => Promise<void>;
  toutMarquerLues: (token: string) => Promise<void>;
  supprimer: (token: string, id: number) => Promise<void>;
  ajouterEnDirect: (notification: NotificationApi) => void; 
  clearError: () => void;
}
