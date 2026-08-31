export interface TacheIA {
  id: number;
  titre: string;
  statut: string;
}

export interface ProjetIA {
  id: number;
  titre: string;
}

export interface AssigneeIA {
  id: number;
  nom: string;
  prenom: string;
}

export interface TaskAiResponse {
  tache: TacheIA;
  project: ProjetIA;
  assignee: AssigneeIA | null;
}

export type MessageRole = "utilisateur" | "assistant" | "systeme";

export interface MessageIA {
  id: number;
  conversationId: number;
  role: "utilisateur" | "assistant" | "systeme";
  contenu: string;
  images?: string[];
  createdAt: string;
}

export interface ChatIaResponse {
  conversationId: number;
  tacheId: number;
  message: {
    id: number;
    role: "assistant";
    contenu: string;
    createdAt: string;
  };
}
export interface AssistanceIaState {
  task: TaskAiResponse | null;
  messages: MessageIA[];
  conversationId: number | null;
  isLoadingTask: boolean;
  isSending: boolean;
  error: string | null;
  chargerTache: (token: string, taskId: number) => Promise<void>;
  envoyerMessage: (
    token: string,
    taskId: number,
    message: string,
  ) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}
