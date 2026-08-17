import type {
  ChatIaResponse,
  MessageIA,
  TaskAiResponse,
} from "@/types/assistanceIaType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function obtenirTacheIA(
  token: string,
  taskId: number,
): Promise<TaskAiResponse> {
  const response = await fetch(`${API_URL}/assistance-ia/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Impossible de récupérer la tâche.",
    );
  }

  return result;
}

export interface TaskMessagesResponse {
  conversationId: number | null;
  tacheId: number;
  messages: MessageIA[];
}

export async function obtenirMessagesTacheIA(
  token: string,
  taskId: number,
): Promise<TaskMessagesResponse> {
  const response = await fetch(
    `${API_URL}/assistance-ia/tasks/${taskId}/messages`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message ||
            "Impossible de récupérer les messages de la tâche.",
    );
  }

  return result;
}

export async function envoyerMessageIA(
  token: string,
  taskId: number,
  message: string,
): Promise<ChatIaResponse> {
  const response = await fetch(
    `${API_URL}/assistance-ia/tasks/${taskId}/chat`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Impossible d'envoyer le message.",
    );
  }

  return result;
}
