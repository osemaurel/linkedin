import { Link, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/** Garde d'affichage : le serveur refuse de toute façon chaque donnée sans le droit. */
export function RequireAdmin() {
  const isAdmin = useIsAdmin();

  if (isAdmin.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center" role="status">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (!isAdmin.data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert aria-hidden="true" className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Accès réservé</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cette partie est réservée aux administrateurs.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Retour à l’application
          </Link>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
