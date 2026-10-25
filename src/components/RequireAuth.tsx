import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center" role="status">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
