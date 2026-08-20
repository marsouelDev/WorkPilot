import { NotificationApi, NotificationsResponse } from "@/types/notificationType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


export const notificationServices = {

  async lister(token: string): Promise<NotificationsResponse> {
    const response = await fetch(`${API_URL}/notification`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les notifications");
    }

    return response.json();
  },

  async marquerLue(token: string, id: number): Promise<NotificationApi> {
    const response = await fetch(`${API_URL}/notification/${id}/lue`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Impossible de marquer comme lue");
    }

    return response.json();
  },

  async toutMarquerLues(token: string): Promise<{ count: number }> {
    const response = await fetch(`${API_URL}/notification/tout-lire`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Impossible de tout marquer comme lu");
    }

    return response.json();
  },

  async supprimer(token: string, id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/notification/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Impossible de supprimer la notification");
    }

    return response.json();
  },
};
