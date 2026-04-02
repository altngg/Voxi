const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type AuthUser = {
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

async function request<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message || "Запрос не выполнен");
  }

  return data as T;
}

export const authApi = {
  login(payload: LoginPayload) {
    return request<AuthResponse>("/api/auth/login", payload);
  },

  register(payload: RegisterPayload) {
    return request<AuthResponse>("/api/auth/register", payload);
  },
};
