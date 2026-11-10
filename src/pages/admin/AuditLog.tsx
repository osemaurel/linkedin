import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
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
  AUDIT_ACTIONS,
  fmtDateTime,
  kindLabel,
  personLabel,
  type AuditEntry,
  type Paged,
  type People,
} from '@/lib/admin';
import { formatCost, formatPrice } from '@/lib/credits';

type PackState = { name: string; credits: number; price: number; active: boolean };

const packLine = (p: PackState) =>
  `${p.credits} crédits · ${formatPrice(p.price, 'XOF')}${p.active ? '' : ' · retiré de la vente'}`;

function packChanges(before: PackState, after: PackState): string {
  const parts: string[] = [];
  if (before.name !== after.name) parts.push(`nom : ${before.name} → ${after.name}`);
  if (before.credits !== after.credits) {
    parts.push(`crédits : ${before.credits} → ${after.credits}`);
  }
  if (before.price !== after.price) {
    parts.push(`prix : ${formatPrice(before.price, 'XOF')} → ${formatPrice(after.price, 'XOF')}`);
  }
  if (before.active !== after.active) {
    parts.push(after.active ? 'remis en vente' : 'retiré de la vente');
  }
  return `« ${after.name} » · ${parts.join(' · ')}`;
}

function describe(entry: AuditEntry): string {
  const d = entry.details as Record<string, string | number | undefined>;
  switch (entry.action) {
    case 'adjust_credits':
      return `${Number(d.delta) > 0 ? '+' : ''}${d.delta} crédits · « ${d.reason ?? ''} »`;
    case 'recheck_payment':
      return `SasPay : ${d.provider_status ?? '?'} → ${d.result ?? '?'}`;
    case 'update_costs': {
      const changes = (entry.details.changes ?? []) as {
        kind: string;
        before: number;
        after: number;
      }[];
      return changes
        .map((c) => `${kindLabel(c.kind)} : ${formatCost(c.before)} → ${formatCost(c.after)}`)
        .join(' · ');
    }
    case 'create_pack': {
      const after = entry.details.after as PackState;
      return `« ${after.name} » · ${packLine(after)}`;
    }
    case 'update_pack':
      return packChanges(entry.details.before as PackState, entry.details.after as PackState);
    default:
      return typeof d.source === 'string' ? d.source : '';
  }
}

export default function AdminAuditLog() {
  const [page, setPage] = useState(0);
  const log = useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: () =>
      adminCall<{ entries: AuditEntry[]; people: People } & Paged>('audit_log', { page }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        subtitle="Chaque action d’administration, qui l’a faite et quand."
      />
      {log.isPending ? (
        <Loading />
      ) : log.isError ? (
        <LoadError message={log.error.message} onRetry={() => void log.refetch()} />
      ) : (
        <div className={panel}>
          <TableWrap>
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Administrateur</th>
                  <th className={th}>Action</th>
                  <th className={th}>Utilisateur concerné</th>
                  <th className={th}>Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {log.data.entries.map((e) => (
                  <tr key={e.id}>
                    <td className={td}>{fmtDateTime(e.created_at)}</td>
                    <td className={td}>{personLabel(log.data.people, e.admin_id)}</td>
                    <td className={`${td} font-medium text-slate-900`}>
                      {AUDIT_ACTIONS[e.action] ?? e.action}
                    </td>
                    <td className={td}>
                      {e.target_user ? (
                        <Link
                          to={`/admin/utilisateurs/${e.target_user}`}
                          className="hover:text-brand-700"
                        >
                          {personLabel(log.data.people, e.target_user)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={td}>{describe(e)}</td>
                  </tr>
                ))}
                {!log.data.entries.length && (
                  <tr>
                    <td colSpan={5} className={`${td} py-8 text-center text-slate-500`}>
                      Le journal est vide.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableWrap>
          <Pager
            page={log.data.page}
            pageSize={log.data.page_size}
            total={log.data.total}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
