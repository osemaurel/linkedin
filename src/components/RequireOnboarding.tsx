import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Spinner } from './Spinner';

/** Tant que les trois questions d'entrée ne sont pas répondues, tout mène à /demarrer. */
export function RequireOnboarding() {
  const { data, isPending } = useOnboarding();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-sky-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  const incomplete =
    data !== undefined && (data.source === null || data.objective === null || data.offer === null);
  if (incomplete && location.pathname !== '/demarrer') {
    return <Navigate to="/demarrer" replace />;
  }

  return <Outlet />;
}
