import {
  AuthResponse,
  ChangePasswordFormData,
  LoginFormData,
  MessageResponse,
  RegisterPayload,
  ResendCodeFormData,
  UpdateProfileFormData,
  User,
  VerifyCodeFormData,
} from "@/types/authTypes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authServices = {
  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return result;
  },

  async register(data: RegisterPayload): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return result;
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
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

  async updateUser(data: UpdateProfileFormData, token: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/profile/update`, {
      method: "PATCH",
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

    return {
      ...result,
      role: result.roleGlobal,
    };
  },

  async changePassword(
    data: ChangePasswordFormData,
    token: string,
  ): Promise<MessageResponse> {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "PATCH",

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
  },

  async verifyCode(data: VerifyCodeFormData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/verify-code`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return result;
  },

  async resendCode(data: ResendCodeFormData): Promise<MessageResponse> {
    const response = await fetch(`${API_URL}/auth/resend-code`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return result;
  },
  
  async getGithubConnectUrl(token: string): Promise<{ url: string }> {
    const response = await fetch(`${API_URL}/auth/github`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message ?? "Impossible de connecter GitHub.");
    }

    return result;
  },
};
