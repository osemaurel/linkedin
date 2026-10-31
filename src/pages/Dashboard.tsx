import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <section className="mx-auto max-w-3xl space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Tableau de bord
      </h1>
      <p className="text-sm text-slate-600 sm:text-base">
        Le suivi de ta progression arrive bientôt. En attendant, ton audit t’attend : ton score et
        des versions de ton profil prêtes à copier.
      </p>
      <Link
        to="/audit"
        className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
      >
        Voir mon audit
      </Link>
    </section>
  );
}
