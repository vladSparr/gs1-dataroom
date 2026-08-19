import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

/** Gate for every route that is not /login or /auth/callback. */
export function RequireAuth() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
