import { requestGet } from "./axios";

export type UserProfile = {
  id: number;
  login: string;
  email: string;
  role: string;
  learningLanguages: number[];
  testResults: number[];
  doneTasks: number[];
  createdAt?: string;
};

export const usersApi = {
  me() {
    return requestGet<UserProfile>("/users/me");
  },

  byId(id: number) {
    return requestGet<UserProfile>(`/users/${id}`);
  },
};
