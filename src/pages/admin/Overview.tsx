import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DailyBars } from '@/components/admin/DailyBars';
import { Badge, LoadError, Loading, PageHeader, panel, StatTile } from '@/components/admin/ui';
import {
  adminCall,
  fmtDateTime,
  fmtNumber,
  kindLabel,
  PAYMENT_STATUS,
  personLabel,
  type Overview,
} from '@/lib/admin';
import { formatPrice } from '@/lib/credits';

export default function AdminOverview() {
  const overview = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminCall<Overview>('overview'),
    staleTime: 0,
  });

  const header = (
    <PageHeader title="Vue d’ensemble" subtitle="L’activité de la plateforme, en un coup d’œil." />
  );
  if (overview.isPending)
    return (
      <div className="space-y-6">
        {header}
        <Loading />
      </div>
    );
  if (overview.isError) {
    return (
      <div className="space-y-6">
        {header}
        <LoadError message={overview.error.message} onRetry={() => void overview.refetch()} />
      </div>
    );
  }

  const { stats: s, recent_users, recent_payments, recent_failures, people } = overview.data;
  const failRate = s.generations_7d
    ? Math.round((s.generations_failed_7d / s.generations_7d) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {header}

      <section aria-label="Indicateurs" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Utilisateurs"
          value={fmtNumber(s.users_total)}
          sub={`+${s.users_7d} sur 7 jours · +${s.users_30d} sur 30 jours`}
        />
        <StatTile
          label="Actifs (7 j)"
          value={fmtNumber(s.active_7d)}
          sub="ont utilisé l’IA cette semaine"
        />
        <StatTile
          label="Revenus (30 j)"
          value={formatPrice(s.revenue_30d, 'XOF')}
          sub={`Total : ${formatPrice(s.revenue_total, 'XOF')}`}
        />
        <StatTile
          label="Paiements en attente"
          value={fmtNumber(s.payments_pending)}
          sub={
            <Link to="/admin/paiements" className="font-medium text-sky-700 hover:underline">
              Voir les paiements
            </Link>
          }
        />
        <StatTile
          label="Crédits en circulation"
          value={fmtNumber(s.credits_outstanding)}
          sub="soldes cumulés des utilisateurs"
        />
        <StatTile
          label="Crédits consommés (30 j)"
          value={fmtNumber(s.credits_consumed_30d)}
          sub={`vendus : ${fmtNumber(s.credits_sold_30d)} · offerts : ${fmtNumber(s.credits_granted_30d)}`}
        />
        <StatTile
          label="Générations (7 j)"
          value={fmtNumber(s.generations_7d)}
          sub={`dont ${s.generations_failed_7d} échouée${s.generations_failed_7d > 1 ? 's' : ''}`}
        />
        <StatTile
          label="Taux d’échec (7 j)"
          value={`${failRate} %`}
          sub={
            <Link to="/admin/ia" className="font-medium text-sky-700 hover:underline">
              Voir l’IA
            </Link>
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${panel} min-w-0 p-5`}>
          <DailyBars
            title="Inscriptions par jour"
            unit="inscriptions"
            points={s.daily.map((d) => ({ day: d.day, value: d.signups }))}
          />
        </div>
        <div className={`${panel} min-w-0 p-5`}>
          <DailyBars
            title="Générations réussies par jour"
            unit="générations"
            points={s.daily.map((d) => ({ day: d.day, value: d.generations }))}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className={`${panel} min-w-0 p-5`}>
          <h2 className="font-semibold text-slate-900">Dernières inscriptions</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {recent_users.map((u) => (
              <li key={u.id}>
                <Link to={`/admin/utilisateurs/${u.id}`} className="block py-2.5 hover:bg-slate-50">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {u.full_name || u.email}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {u.email} · {fmtDateTime(u.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${panel} min-w-0 p-5`}>
          <h2 className="font-semibold text-slate-900">Derniers paiements</h2>
          {recent_payments.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {recent_payments.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {personLabel(people, p.user_id)}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {formatPrice(p.amount, p.currency)} · {p.credits} crédits ·{' '}
                      {fmtDateTime(p.created_at)}
                    </span>
                  </span>
                  <Badge tone={PAYMENT_STATUS[p.status].tone}>
                    {PAYMENT_STATUS[p.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Aucun paiement pour l’instant.</p>
          )}
        </div>

        <div className={`${panel} min-w-0 p-5`}>
          <h2 className="font-semibold text-slate-900">Dernières erreurs IA</h2>
          {recent_failures.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {recent_failures.map((g) => (
                <li key={g.id} className="py-2.5">
                  <span className="block text-sm font-medium text-slate-900">
                    {kindLabel(g.kind)} · {personLabel(people, g.user_id)}
                  </span>
                  <span className="block truncate text-xs text-red-700">
                    {g.error || 'Erreur sans détail'}
                  </span>
                  <span className="block text-xs text-slate-500">{fmtDateTime(g.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Aucune erreur récente. Tout fonctionne.</p>
          )}
        </div>
      </section>
    </div>
  );
}
