import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const api = axios.create({
  baseURL: "http://localhost/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

let pendingRefresh: Promise<AxiosResponse> | null = null;

const isAuthRoute = (url?: string) => Boolean(url?.includes("/auth/"));

const handleAuthFailure = () => {
  try {
    localStorage.removeItem("authUser");
  } catch {
    // localStorage may be unavailable
  }
  if (typeof window === "undefined") {
    return;
  }
  const { pathname } = window.location;
  if (pathname.startsWith("/login") || pathname.startsWith("/registration")) {
    return;
  }
  window.location.href = "/login";
};

const refreshTokens = () => {
  if (!pendingRefresh) {
    pendingRefresh = api.post("/auth/refresh").finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetriableRequestConfig | undefined;

    if (!originalConfig || error.response?.status !== 403) {
      return Promise.reject(error);
    }

    if (isAuthRoute(originalConfig.url)) {
      return Promise.reject(error);
    }

    if (originalConfig._retry) {
      handleAuthFailure();
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    try {
      await refreshTokens();
      return await api.request(originalConfig);
    } catch (refreshError) {
      handleAuthFailure();
      return Promise.reject(refreshError);
    }
  },
);

const getRequestErrorMessage = (err: unknown) => {
  if (err && typeof err === "object") {
    const errorObject = err as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    return (
      errorObject.response?.data?.message ||
      errorObject.message ||
      "Запрос не выполнен"
    );
  }

  return "Запрос не выполнен";
};

export async function request<T>(path: string, payload: unknown): Promise<T> {
  try {
    const { data } = await api.post<T>(path, payload);
    return data;
  } catch (err: unknown) {
    throw new Error(getRequestErrorMessage(err));
  }
}

export async function requestGet<T>(
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  try {
    const { data } = await api.get<T>(path, { params });
    return data;
  } catch (err: unknown) {
    throw new Error(getRequestErrorMessage(err));
  }
}
