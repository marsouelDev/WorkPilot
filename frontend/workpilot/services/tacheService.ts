import type { Tache } from "@/types/projectType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function choisirTache(
  token: string,
  tacheId: number,
): Promise<Tache> {
  const response = await fetch(`${API_URL}/tasks/${tacheId}/choisir`, {
    method: "POST",
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
        : result?.message || "Impossible de choisir cette tâche.",
    );
  }

  return result;
}
