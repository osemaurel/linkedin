import { useId, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X } from 'lucide-react';
import {
  Badge,
  LoadError,
  Loading,
  panel,
  StatTile,
  TableWrap,
  td,
  th,
} from '@/components/admin/ui';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import {
  adminCall,
  duration,
  fmtDate,
  fmtDateTime,
  fmtNumber,
  GENERATION_STATUS,
  kindLabel,
  OBJECTIVE_LABELS,
  PAYMENT_STATUS,
  REASON_LABELS,
  type UserDetail,
} from '@/lib/admin';
import { formatPrice } from '@/lib/credits';
import { inputClass } from '@/lib/ui';

function AdjustCredits({ userId, balance }: { userId: string; balance: number }) {
  const id = useId();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const adjust = useMutation({
    mutationFn: (delta: number) =>
      adminCall<{ balance: number }>('adjust_credits', {
        user_id: userId,
        delta,
        reason: reason.trim(),
      }),
    onSuccess: async ({ balance: next }, delta) => {
      setDone(`${delta > 0 ? '+' : ''}${delta} crédits appliqués. Nouveau solde : ${next}.`);
      setAmount('');
      setReason('');
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const n = Number(amount);
  const valid = Number.isInteger(n) && n > 0 && n <= 10_000 && reason.trim().length >= 3;

  function submit(sign: 1 | -1) {
    return (event?: FormEvent) => {
      event?.preventDefault();
      if (!valid) return;
      const delta = sign * n;
      const verb = sign > 0 ? 'Ajouter' : 'Retirer';
      if (!window.confirm(`${verb} ${n} crédits (solde actuel : ${balance}) ?`)) return;
      setDone(null);
      adjust.mutate(delta);
    };
  }

  return (
    <form onSubmit={submit(1)} className={`${panel} space-y-3 p-5`}>
      <h2 className="font-semibold text-slate-900">Ajuster les crédits</h2>
      <p className="text-sm text-slate-600">
        Solde actuel : <span className="font-semibold text-slate-900">{fmtNumber(balance)}</span>.
        Chaque ajustement est tracé au journal avec son motif.
      </p>
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div>
          <label htmlFor={`${id}-n`} className="mb-1.5 block text-sm font-medium text-slate-700">
            Crédits
          </label>
          <input
            id={`${id}-n`}
            type="number"
            min={1}
            max={10000}
            step={1}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${id}-r`} className="mb-1.5 block text-sm font-medium text-slate-700">
            Motif
          </label>
          <input
            id={`${id}-r`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Ex. : geste commercial après un incident"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!valid || adjust.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {adjust.isPending && <Spinner />}
          Ajouter
        </button>
        <button
          type="button"
          onClick={submit(-1)}
          disabled={!valid || adjust.isPending}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Retirer
        </button>
      </div>
      {done && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {done}
        </p>
      )}
      {adjust.isError && (
        <p role="alert" className="text-sm text-red-700">
          {adjust.error.message}
        </p>
      )}
    </form>
  );
}

function AdminRight({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const self = user?.id === userId;
  const toggle = useMutation({
    mutationFn: () =>
      adminCall<{ is_admin: boolean }>('set_admin', { user_id: userId, admin: !isAdmin }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  return (
    <div className={`${panel} space-y-3 p-5`}>
      <h2 className="font-semibold text-slate-900">Droits</h2>
      <p className="flex items-center gap-2 text-sm text-slate-700">
        {isAdmin ? (
          <Check aria-hidden="true" className="h-4 w-4 text-emerald-600" />
        ) : (
          <X aria-hidden="true" className="h-4 w-4 text-slate-400" />
        )}
        {isAdmin
          ? 'Administrateur : accès au centre de contrôle'
          : 'Utilisateur : pas d’accès au centre de contrôle'}
      </p>
      {self ? (
        <p className="text-xs text-slate-500">Tu ne peux pas modifier tes propres droits.</p>
      ) : (
        <button
          type="button"
          onClick={() => {
            const question = isAdmin
              ? 'Retirer le droit d’administrateur à cet utilisateur ?'
              : 'Donner à cet utilisateur un accès complet au centre de contrôle ?';
            if (window.confirm(question)) toggle.mutate();
          }}
          disabled={toggle.isPending}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
            isAdmin
              ? 'text-red-700 ring-1 ring-red-200 hover:bg-red-50'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isAdmin ? 'Retirer le droit d’administrateur' : 'Nommer administrateur'}
        </button>
      )}
      {toggle.isError && (
        <p role="alert" className="text-sm text-red-700">
          {toggle.error.message}
        </p>
      )}
    </div>
  );
}

export default function AdminUserDetail() {
  const { id = '' } = useParams();
  const detail = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => adminCall<UserDetail>('user', { user_id: id }),
  });

  const back = (
    <Link
      to="/admin/utilisateurs"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      Utilisateurs
    </Link>
  );
  if (detail.isPending)
    return (
      <div className="space-y-6">
        {back}
        <Loading />
      </div>
    );
  if (detail.isError) {
    return (
      <div className="space-y-6">
        {back}
        <LoadError message={detail.error.message} onRetry={() => void detail.refetch()} />
      </div>
    );
  }

  const d = detail.data;
  const name = d.profile?.full_name || d.auth.email;

  return (
    <div className="space-y-6">
      {back}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {name}
          </h1>
          {d.is_admin && <Badge tone="bg-slate-900 text-white ring-slate-900">Admin</Badge>}
        </div>
        <p className="mt-1.5 text-sm text-slate-600">
          {d.auth.email} · inscrit le {fmtDate(d.auth.created_at)} · dernière connexion :{' '}
          {fmtDateTime(d.auth.last_sign_in_at)} ·{' '}
          {d.auth.email_confirmed_at ? 'e-mail confirmé' : 'e-mail non confirmé'}
        </p>
      </header>

      <section
        aria-label="Chiffres"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatTile label="Solde" value={fmtNumber(d.profile?.credits_balance ?? 0)} sub="crédits" />
        <StatTile
          label="Score"
          value={d.latest_score ?? '—'}
          sub={d.latest_score !== null ? 'dernier audit' : 'pas d’audit'}
        />
        <StatTile label="Audits" value={fmtNumber(d.counts.audits)} />
        <StatTile label="Posts" value={fmtNumber(d.counts.posts)} />
        <StatTile label="Contacts" value={fmtNumber(d.counts.contacts)} />
        <StatTile label="Générations" value={fmtNumber(d.counts.generations)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <AdjustCredits userId={d.auth.id} balance={d.profile?.credits_balance ?? 0} />

          <section className={panel}>
            <h2 className="px-5 pt-5 font-semibold text-slate-900">Mouvements de crédits</h2>
            <TableWrap>
              <table className="mt-3 w-full min-w-[480px]">
                <thead className="border-y border-slate-100">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Motif</th>
                    <th className={`${th} text-right`}>Mouvement</th>
                    <th className={`${th} text-right`}>Solde après</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.credits.map((c) => (
                    <tr key={c.id}>
                      <td className={td}>{fmtDateTime(c.created_at)}</td>
                      <td className={td}>{REASON_LABELS[c.reason] ?? c.reason}</td>
                      <td
                        className={`${td} text-right font-medium tabular-nums ${c.delta > 0 ? 'text-emerald-700' : 'text-slate-900'}`}
                      >
                        {c.delta > 0 ? `+${c.delta}` : c.delta}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{c.balance_after}</td>
                    </tr>
                  ))}
                  {!d.credits.length && (
                    <tr>
                      <td colSpan={4} className={`${td} text-slate-500`}>
                        Aucun mouvement.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </section>

          <section className={panel}>
            <h2 className="px-5 pt-5 font-semibold text-slate-900">Générations récentes</h2>
            <TableWrap>
              <table className="mt-3 w-full min-w-[640px]">
                <thead className="border-y border-slate-100">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Type</th>
                    <th className={th}>Statut</th>
                    <th className={`${th} text-right`}>Coût</th>
                    <th className={`${th} text-right`}>Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.generations.map((g) => (
                    <tr key={g.id}>
                      <td className={td}>{fmtDateTime(g.created_at)}</td>
                      <td className={td}>
                        {kindLabel(g.kind)}
                        {g.error && (
                          <span className="block max-w-xs truncate text-xs text-red-700">
                            {g.error}
                          </span>
                        )}
                      </td>
                      <td className={td}>
                        <Badge tone={GENERATION_STATUS[g.status].tone}>
                          {GENERATION_STATUS[g.status].label}
                        </Badge>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{g.cost_credits ?? 0}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {duration(g.created_at, g.completed_at)}
                      </td>
                    </tr>
                  ))}
                  {!d.generations.length && (
                    <tr>
                      <td colSpan={5} className={`${td} text-slate-500`}>
                        Aucune génération.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <section className={`${panel} space-y-3 p-5 text-sm`}>
            <h2 className="font-semibold text-slate-900">Profil</h2>
            <dl className="space-y-2">
              {[
                [
                  'Objectif',
                  d.profile?.objective
                    ? (OBJECTIVE_LABELS[d.profile.objective] ?? d.profile.objective)
                    : '—',
                ],
                ['Pays', d.profile?.country || '—'],
                ['Titre', d.strategic?.headline || '—'],
                ['Positionnement', d.strategic?.positioning || '—'],
                ['Audience', d.strategic?.target_audience || '—'],
                ['Source du profil', d.strategic?.source ?? '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={`${panel} p-5`}>
            <h2 className="font-semibold text-slate-900">Paiements</h2>
            {d.payments.length ? (
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {d.payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 py-2.5">
                    <span>
                      <span className="block font-medium text-slate-900">
                        {formatPrice(p.amount, p.currency)} · {p.credits} crédits
                      </span>
                      <span className="block text-xs text-slate-500">
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
              <p className="mt-3 text-sm text-slate-500">Aucun paiement.</p>
            )}
          </section>

          <AdminRight userId={d.auth.id} isAdmin={d.is_admin} />
        </div>
      </div>
    </div>
  );
}
