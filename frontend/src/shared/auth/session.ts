import type { AuthUser } from "../api/auth";

const AUTH_USER_KEY = "authUser";

export const saveAuthUser = (user: AuthUser) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthUser = () => {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // localStorage may be unavailable
  }
};

export const hasAuthSession = () => {
  try {
    return Boolean(localStorage.getItem(AUTH_USER_KEY));
  } catch {
    return false;
  }
};
