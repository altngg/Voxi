import { Navigate, Outlet } from "react-router-dom";
import { hasAuthSession } from "../shared/auth";

export const RequireAuth = () => {
  if (!hasAuthSession()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
