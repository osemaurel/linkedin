import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Badge,
  FilterTabs,
  LoadError,
  Loading,
  PageHeader,
  Pager,
  panel,
  TableWrap,
  td,
  th,
} from '@/components/admin/ui';
import {
  adminCall,
  duration,
  fmtDateTime,
  fmtNumber,
  GENERATION_STATUS,
  KIND_LABELS,
  kindLabel,
  personLabel,
  type AdminGeneration,
  type GenerationStat,
  type Paged,
  type People,
} from '@/lib/admin';
import { inputClass } from '@/lib/ui';

type Filter = 'all' | AdminGeneration['status'];
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'success', label: 'Réussies' },
  { value: 'failed', label: 'Échouées' },
  { value: 'pending', label: 'En cours' },
];

type Result = { generations: AdminGeneration[]; stats: GenerationStat[]; people: People } & Paged;

export default function AdminGenerations() {
  const [status, setStatus] = useState<Filter>('all');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const gens = useQuery({
    queryKey: ['admin', 'generations', status, kind, page],
    queryFn: () =>
      adminCall<Result>('generations', {
        page,
        status: status === 'all' ? undefined : status,
        kind: kind || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="IA & générations" subtitle="Chaque appel à l’IA : coût, durée, erreurs." />

      {gens.isPending ? (
        <Loading />
      ) : gens.isError ? (
        <LoadError message={gens.error.message} onRetry={() => void gens.refetch()} />
      ) : (
        <>
          <section className={panel} aria-labelledby="stats-ia">
            <h2 id="stats-ia" className="px-5 pt-5 font-semibold text-slate-900">
              Par type, sur 30 jours
            </h2>
            <TableWrap>
              <table className="mt-3 w-full min-w-[720px]">
                <thead className="border-y border-slate-100">
                  <tr>
                    <th className={th}>Type</th>
                    <th className={`${th} text-right`}>Appels</th>
                    <th className={`${th} text-right`}>Échecs</th>
                    <th className={`${th} text-right`}>Crédits débités</th>
                    <th className={`${th} text-right`}>Jetons entrée</th>
                    <th className={`${th} text-right`}>Jetons sortie</th>
                    <th className={`${th} text-right`}>Durée moyenne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gens.data.stats.map((s) => (
                    <tr key={s.kind}>
                      <td className={`${td} font-medium text-slate-900`}>{kindLabel(s.kind)}</td>
                      <td className={`${td} text-right tabular-nums`}>{fmtNumber(s.total)}</td>
                      <td
                        className={`${td} text-right tabular-nums ${s.failed ? 'text-red-700' : ''}`}
                      >
                        {fmtNumber(s.failed)}
                        {s.total ? ` (${Math.round((s.failed / s.total) * 100)} %)` : ''}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{fmtNumber(s.credits)}</td>
                      <td className={`${td} text-right tabular-nums`}>{fmtNumber(s.tokens_in)}</td>
                      <td className={`${td} text-right tabular-nums`}>{fmtNumber(s.tokens_out)}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {s.avg_seconds === null
                          ? '—'
                          : `${String(s.avg_seconds).replace('.', ',')} s`}
                      </td>
                    </tr>
                  ))}
                  {!gens.data.stats.length && (
                    <tr>
                      <td colSpan={7} className={`${td} text-slate-500`}>
                        Aucun appel sur 30 jours.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FilterTabs
              label="Statut"
              value={status}
              options={FILTERS}
              onChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
            />
            <label className="block sm:w-64">
              <span className="sr-only">Type de génération</span>
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setPage(0);
                }}
                className={inputClass}
              >
                <option value="">Tous les types</option>
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={panel}>
            <TableWrap>
              <table className="w-full min-w-[820px]">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Utilisateur</th>
                    <th className={th}>Type</th>
                    <th className={th}>Statut</th>
                    <th className={`${th} text-right`}>Coût</th>
                    <th className={`${th} text-right`}>Jetons</th>
                    <th className={`${th} text-right`}>Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gens.data.generations.map((g) => (
                    <tr key={g.id}>
                      <td className={td}>{fmtDateTime(g.created_at)}</td>
                      <td className={td}>
                        <Link
                          to={`/admin/utilisateurs/${g.user_id}`}
                          className="font-medium text-slate-900 hover:text-sky-700"
                        >
                          {personLabel(gens.data.people, g.user_id)}
                        </Link>
                      </td>
                      <td className={td}>
                        {kindLabel(g.kind)}
                        {g.error && (
                          <button
                            type="button"
                            onClick={() => setOpen((o) => (o === g.id ? null : g.id))}
                            aria-expanded={open === g.id}
                            className={`block text-left text-xs text-red-700 hover:underline ${open === g.id ? '' : 'max-w-xs truncate'}`}
                          >
                            {g.error}
                          </button>
                        )}
                      </td>
                      <td className={td}>
                        <Badge tone={GENERATION_STATUS[g.status].tone}>
                          {GENERATION_STATUS[g.status].label}
                        </Badge>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{g.cost_credits ?? 0}</td>
                      <td className={`${td} text-right text-xs tabular-nums`}>
                        {fmtNumber(g.tokens_in ?? null)} → {fmtNumber(g.tokens_out ?? null)}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>
                        {duration(g.created_at, g.completed_at)}
                      </td>
                    </tr>
                  ))}
                  {!gens.data.generations.length && (
                    <tr>
                      <td colSpan={7} className={`${td} py-8 text-center text-slate-500`}>
                        Aucune génération avec ces filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
            <Pager
              page={gens.data.page}
              pageSize={gens.data.page_size}
              total={gens.data.total}
              onPage={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
