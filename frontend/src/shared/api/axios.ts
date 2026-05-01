import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function request<T>(path: string, payload: unknown): Promise<T> {
  try {
    const { data } = await api.post<T>(path, payload);
    return data;
  } catch (err: any) {
    const message =
      err.response?.data?.message || err.message || "Запрос не выполнен";
    throw new Error(message);
  }
}
