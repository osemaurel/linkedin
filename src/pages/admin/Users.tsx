import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  Badge,
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
  fmtDate,
  fmtDateTime,
  fmtNumber,
  OBJECTIVE_LABELS,
  type AdminUserRow,
  type Paged,
} from '@/lib/admin';
import { inputClass } from '@/lib/ui';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // La recherche part 300 ms après la dernière frappe.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(input.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [input]);

  const users = useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: () => adminCall<{ users: AdminUserRow[] } & Paged>('users', { search, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        subtitle={
          users.data
            ? `${fmtNumber(users.data.total)} compte${users.data.total > 1 ? 's' : ''}`
            : undefined
        }
      >
        <label className="relative block w-full sm:w-80">
          <span className="sr-only">Rechercher un utilisateur</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nom ou e-mail"
            className={`${inputClass} pl-9`}
          />
        </label>
      </PageHeader>

      {users.isPending ? (
        <Loading />
      ) : users.isError ? (
        <LoadError message={users.error.message} onRetry={() => void users.refetch()} />
      ) : (
        <div className={panel}>
          <TableWrap>
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className={th}>Utilisateur</th>
                  <th className={th}>Inscription</th>
                  <th className={th}>Objectif</th>
                  <th className={th}>Pays</th>
                  <th className={`${th} text-right`}>Solde</th>
                  <th className={th}>Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.data.users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => navigate(`/admin/utilisateurs/${u.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className={td}>
                      <a
                        href={`/admin/utilisateurs/${u.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/admin/utilisateurs/${u.id}`);
                        }}
                        className="font-medium text-slate-900 hover:text-sky-700"
                      >
                        {u.full_name || u.email}
                      </a>
                      {u.is_admin && (
                        <span className="ml-2 align-middle">
                          <Badge tone="bg-slate-900 text-white ring-slate-900">Admin</Badge>
                        </span>
                      )}
                      <span className="block text-xs text-slate-500">{u.email}</span>
                    </td>
                    <td className={td}>{fmtDate(u.created_at)}</td>
                    <td className={td}>
                      {u.objective ? (OBJECTIVE_LABELS[u.objective] ?? u.objective) : '—'}
                    </td>
                    <td className={td}>{u.country || '—'}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {fmtNumber(u.credits_balance)}
                    </td>
                    <td className={td}>
                      {u.last_activity_at ? fmtDateTime(u.last_activity_at) : '—'}
                    </td>
                  </tr>
                ))}
                {!users.data.users.length && (
                  <tr>
                    <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                      Aucun utilisateur ne correspond à « {search} ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableWrap>
          <Pager
            page={users.data.page}
            pageSize={users.data.page_size}
            total={users.data.total}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
