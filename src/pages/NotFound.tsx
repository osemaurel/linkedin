import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="space-y-4">
      <p className="text-sm font-medium uppercase tracking-wider text-sky-700">Erreur 404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Page introuvable
      </h1>
      <p className="text-sm text-slate-600 sm:text-base">
        La page que tu cherches n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
      >
        Retour au tableau de bord
      </Link>
    </section>
  );
}
