import type {
  Projet,
  CreateProjectDto,
  InviteMemberDto,
  ChangeRoleDto,
  ProjetResponse,
  CahierDesChargesResponse,
  TachesProjetResponse,
  UtilisateurRecherche,
} from "@/types/projectType";
import type { MembreProjet } from "@/types/projectType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("NEXT_PUBLIC_API_URL n'est pas configurée.");
}

export async function creerProjet(
  token: string,
  data: CreateProjectDto,
): Promise<ProjetResponse> {
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
  return result;
}

export async function listerMesProjets(token: string): Promise<Projet[]> {
  const response = await fetch(`${API_URL}/projects`, {
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
        : result?.message || "Impossible de récupérer les projets.",
    );
  }

  return result;
}

export async function obtenirProjet(
  token: string,
  projetId: number,
): Promise<Projet> {
  const response = await fetch(`${API_URL}/projects/${projetId}`, {
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
        : result?.message || "Impossible de récupérer le projet.",
    );
  }

  return result;
}

export async function supprimerProjet(
  token: string,
  projetId: number,
): Promise<ProjetResponse> {
  const response = await fetch(`${API_URL}/projects/${projetId}`, {
    method: "DELETE",
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
        : result?.message || "Impossible de supprimer le projet.",
    );
  }

  return result;
}

export async function regenererCahierDesCharges(
  token: string,
  projetId: number,
): Promise<CahierDesChargesResponse> {
  const response = await fetch(`${API_URL}/projects/${projetId}/regenerer`, {
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
        : result?.message || "Impossible de régénérer le cahier des charges.",
    );
  }

  return result;
}

export async function inviterMembre(
  token: string,
  projetId: number,
  data: InviteMemberDto,
) {
  const response = await fetch(`${API_URL}/projects/${projetId}/membres`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Impossible d’inviter le membre.",
    );
  }

  return result;
}


export async function rechercherUtilisateursParEmail(
  token: string,
  email: string,
): Promise<UtilisateurRecherche[]> {
  const response = await fetch(
    `${API_URL}/projects/utilisateur/recherche?email=${encodeURIComponent(email)}`,
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
            "Impossible de rechercher les utilisateurs.",
    );
  }

  return result;
}

export async function changerRole(
  token: string,
  projetId: number,
  membreId: number,
  data: ChangeRoleDto,
): Promise<ProjetResponse> {
  const response = await fetch(
    `${API_URL}/projects/${projetId}/membres/${membreId}/role`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Impossible de modifier le rôle.",
    );
  }

  return result;
}

export async function retirerMembre(
  token: string,
  projetId: number,
  utilisateurId: number,
): Promise<ProjetResponse> {
  const response = await fetch(
    `${API_URL}/projects/${projetId}/membres/${utilisateurId}/retirer`,
    {
      method: "DELETE",
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
        : result?.message || "Impossible de retirer le membre.",
    );
  }

  return result;
}

export async function listerProjetsSysteme(token: string): Promise<Projet[]> {
  const response = await fetch(`${API_URL}/projects/admin/projects`, {
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
        : result?.message || "Impossible de récupérer les projets du système.",
    );
  }

  return result;
}

export async function obtenirCahierDesCharges(
  projetId: number,
  token: string,
): Promise<CahierDesChargesResponse> {
  const response = await fetch(
    `${API_URL}/projects/${projetId}/cahier-des-charges`,
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
        : result?.message || "Impossible de récupérer le cahier des charges.",
    );
  }

  return result;
}

export async function listerTachesDuProjet(
  projetId: number,
  token: string,
): Promise<TachesProjetResponse> {
  const response = await fetch(`${API_URL}/projects/${projetId}/taches`, {
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
        : result?.message || "Impossible de récupérer les tâches du projet.",
    );
  }

  return result;
}

export async function obtenirMembresProjet(
  token: string,
  projetId: number,
): Promise<MembreProjet[]> {
  const response = await fetch(
    `${API_URL}/projects/${projetId}/listes/membres`,
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
            "Impossible de récupérer les membres du projet.",
    );
  }

  return result;
}
