// public.route.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/contexts/auth.context';
import Login from '@/pages/login/login';

export default function PublicRoute({ children }) {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (role) {
    return <Navigate to={`/${role}/`} replace />;
  }

  return children ?? <Login />;
}