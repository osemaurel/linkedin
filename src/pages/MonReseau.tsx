import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FollowupPanel } from '@/components/network/FollowupPanel';
import { OutreachForm } from '@/components/network/OutreachForm';
import { TargetingPanel } from '@/components/network/TargetingPanel';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { deleteContact, fetchNetwork, isDue, type Contact, type NetworkData } from '@/lib/network';

type Tab = 'ciblage' | 'messages' | 'suivi';
const TABS: { id: Tab; label: string }[] = [
  { id: 'ciblage', label: 'Ciblage' },
  { id: 'messages', label: 'Messages' },
  { id: 'suivi', label: 'Suivi' },
];

function Workspace({
  userId,
  initial,
  openContact,
  reload,
}: {
  userId: string;
  initial: NetworkData;
  openContact: string | null;
  reload: (open?: { tab: Tab; contact: string | null }) => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const requested = params.get('onglet') as Tab | null;
  const tab: Tab =
    requested && TABS.some((t) => t.id === requested)
      ? requested
      : data.targets
        ? data.contacts.length
          ? 'suivi'
          : 'messages'
        : 'ciblage';
  const dueCount = data.contacts.filter(isDue).length;

  // Le cache suit les modifications : revenir sur la page n'affiche jamais un état ancien.
  useEffect(() => {
    queryClient.setQueryData(['network', userId], data);
  }, [data, queryClient, userId]);

  const changeContact = (id: string, patch: Partial<Contact>) =>
    setData((d) => ({
      ...d,
      contacts: d.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  async function removeContact(id: string) {
    setError(null);
    try {
      await deleteContact(id);
      setData((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Mon réseau"
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams({ onglet: t.id }, { replace: true })}
            className={`-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
              tab === t.id
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
            {t.id === 'suivi' && dueCount > 0 && (
              <span
                aria-label={`${dueCount} à relancer`}
                className="rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800"
              >
                {dueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'ciblage' && (
          <TargetingPanel
            userId={userId}
            targets={data.targets}
            onChange={(targets) => setData((d) => ({ ...d, targets }))}
            onGenerated={() => reload({ tab: 'ciblage', contact: null })}
          />
        )}
        {tab === 'messages' && (
          <OutreachForm onWritten={(contactId) => reload({ tab: 'suivi', contact: contactId })} />
        )}
        {tab === 'suivi' && (
          <FollowupPanel
            contacts={data.contacts}
            openId={openContact}
            onChange={changeContact}
            onDelete={(id) => void removeContact(id)}
          />
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

export default function MonReseau() {
  const { user } = useAuth();
  const [, setParams] = useSearchParams();
  const network = useQuery({
    queryKey: ['network', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchNetwork(user?.id as string),
    staleTime: 0,
  });
  // Après une génération : l'espace repart des données enregistrées.
  const [session, setSession] = useState<{ version: number; contact: string | null }>({
    version: 0,
    contact: null,
  });

  async function reload(open?: { tab: Tab; contact: string | null }) {
    await network.refetch();
    if (open) setParams({ onglet: open.tab }, { replace: true });
    setSession((s) => ({ version: s.version + 1, contact: open?.contact ?? null }));
  }

  let body;
  if (network.isPending) {
    body = (
      <div className="grid place-items-center py-16 text-sky-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  } else if (network.isError) {
    body = (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>Impossible de charger ton réseau.</p>
        <button
          type="button"
          onClick={() => void network.refetch()}
          className="mt-2 font-medium underline"
        >
          Réessayer
        </button>
      </div>
    );
  } else {
    body = (
      <Workspace
        key={session.version}
        userId={user?.id as string}
        initial={network.data}
        openContact={session.contact}
        reload={reload}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Mon réseau
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          Ta cible, les recherches LinkedIn qui la trouvent, et les messages pour l’aborder.
        </p>
      </header>
      {body}
    </div>
  );
}
