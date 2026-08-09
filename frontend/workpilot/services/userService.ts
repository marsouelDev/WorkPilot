import { CreateUserByAdminFormData, User } from "@/types/userTypes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const userService = {
  async createByAdmin(data: CreateUserByAdminFormData, token: string) {
    const response = await fetch(`${API_URL}/users/create-by-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erreur création utilisateur");
    }

    return result;
  },

  async getAll(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }
    console.log(result);
    return result;
  },

  async getOne(id: number, token: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return {
      ...result,
      role: result.roleGlobal,
    };
  },

  async changeStatus(
    id: number,
    statut: User["statut"],
    token: string,
  ): Promise<User> {
    const response = await fetch(`${API_URL}/users/${id}/statut`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ statut }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return {
      ...result,
      role: result.roleGlobal,
    };
  },
};
