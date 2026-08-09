import type {
  Projet,
  CreateProjectDto,
  InviteMemberDto,
  ChangeRoleDto,
} from "@/types/projectType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("NEXT_PUBLIC_API_URL n'est pas configurée.");
}

export async function creerProjet(
  token: string,
  data: CreateProjectDto,
): Promise<Projet> {
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
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
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
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
  return result;
}

export async function regenererCahierDesCharges(
  token: string,
  projetId: number,
): Promise<Projet> {
  const response = await fetch(`${API_URL}/projects/${projetId}/regenerer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
  return result;
}

export async function inviterMembre(
  token: string,
  projetId: number,
  data: InviteMemberDto,
): Promise<Projet> {
  const response = await fetch(`${API_URL}/projects/${projetId}/membres`, {
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

export async function changerRole(
  token: string,
  projetId: number,
  membreId: number,
  data: ChangeRoleDto,
): Promise<Projet> {
  const response = await fetch(
    `${API_URL}/projects/${projetId}/membres/${membreId}/role`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
  return result;
}

export async function retirerMembre(
  token: string,
  projetId: number,
  utilisateurId: number,
): Promise<Projet> {
  const response = await fetch(
    `${API_URL}/projects/${projetId}/membres/${utilisateurId}/retirer`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
  return result;
}

export async function listerProjetsSysteme(token: string): Promise<Projet[]> {
  const response = await fetch(`${API_URL}/projects/admin/projects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
  return result;

  return response.json();
}
