import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
