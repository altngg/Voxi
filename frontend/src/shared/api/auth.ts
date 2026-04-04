import { request } from "./axios";

export type AuthUser = {
  // TODO: move to different file
  id: number;
  login: string;
  email: string;
  role: string;
  learningLanguageId?: number;
  learningLanguageName?: string;
  createdAt?: string;
};

export type AuthResponse = {
  user: AuthUser;
  message: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  login: string;
  email: string;
  password: string;
  learningLanguageId?: number;
};

export const authApi = {
  login(payload: LoginPayload) {
    return request<AuthResponse>("/auth/login", payload);
  },

  register(payload: RegisterPayload) {
    return request<AuthResponse>("/auth/register", payload);
  },

  logout() {
    return request<{ message: string }>("/auth/logout", {});
  },
};
