import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/core/contexts/auth.context";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { role, loading } = useAuth();











  if (loading) {

    return null;
  }


  if (!role) {

    return <Navigate to="/" replace />;
  }


  if (allowedRoles && !allowedRoles.includes(role)) {

    return <Navigate to={`/${role}`} replace />;
  }


  return children ? children : <Outlet />;
}
