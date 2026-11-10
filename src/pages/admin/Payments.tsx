import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
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
  fmtDateTime,
  fmtNumber,
  PAYMENT_STATUS,
  personLabel,
  type AdminPayment,
  type Paged,
  type People,
} from '@/lib/admin';
import { formatPrice } from '@/lib/credits';

type Filter = 'all' | AdminPayment['status'];
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'succeeded', label: 'Réussis' },
  { value: 'failed', label: 'Échoués' },
];

function Recheck({ payment }: { payment: AdminPayment }) {
  const queryClient = useQueryClient();
  const recheck = useMutation({
    mutationFn: () =>
      adminCall<{ status: string; provider_status: string | null }>('recheck_payment', {
        payment_id: payment.id,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => recheck.mutate()}
        disabled={recheck.isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {recheck.isPending && <Spinner />}
        Revérifier
      </button>
      {recheck.isSuccess && (
        <p role="status" className="text-xs text-slate-600">
          SasPay : {recheck.data.provider_status ?? 'session introuvable'}
        </p>
      )}
      {recheck.isError && (
        <p role="alert" className="max-w-[14rem] text-xs text-red-700">
          {recheck.error.message}
        </p>
      )}
    </div>
  );
}

export default function AdminPayments() {
  const [status, setStatus] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const payments = useQuery({
    queryKey: ['admin', 'payments', status, page],
    queryFn: () =>
      adminCall<{ payments: AdminPayment[]; people: People } & Paged>('payments', {
        page,
        status: status === 'all' ? undefined : status,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Paiements" subtitle="Recharges par SasPay, du plus récent au plus ancien.">
        <FilterTabs
          label="Statut"
          value={status}
          options={FILTERS}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
        />
      </PageHeader>

      {payments.isPending ? (
        <Loading />
      ) : payments.isError ? (
        <LoadError message={payments.error.message} onRetry={() => void payments.refetch()} />
      ) : (
        <div className={panel}>
          <TableWrap>
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Utilisateur</th>
                  <th className={`${th} text-right`}>Montant</th>
                  <th className={`${th} text-right`}>Crédits</th>
                  <th className={th}>Statut</th>
                  <th className={th}>Référence SasPay</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{fmtDateTime(p.created_at)}</td>
                    <td className={td}>
                      <Link
                        to={`/admin/utilisateurs/${p.user_id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {personLabel(payments.data.people, p.user_id)}
                      </Link>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>
                      {formatPrice(p.amount, p.currency)}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{fmtNumber(p.credits)}</td>
                    <td className={td}>
                      <Badge tone={PAYMENT_STATUS[p.status].tone}>
                        {PAYMENT_STATUS[p.status].label}
                      </Badge>
                    </td>
                    <td className={`${td} font-mono text-xs`} title={p.provider_ref}>
                      {p.provider_ref ? `${p.provider_ref.slice(0, 8)}…` : '—'}
                    </td>
                    <td className={td}>{p.status === 'pending' ? <Recheck payment={p} /> : '—'}</td>
                  </tr>
                ))}
                {!payments.data.payments.length && (
                  <tr>
                    <td colSpan={7} className={`${td} py-8 text-center text-slate-500`}>
                      Aucun paiement{status !== 'all' ? ' avec ce statut' : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableWrap>
          <Pager
            page={payments.data.page}
            pageSize={payments.data.page_size}
            total={payments.data.total}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
