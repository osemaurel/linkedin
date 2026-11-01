import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
import { useProfile } from '@/hooks/useProfile';
import { formatCredits, formatPrice, refreshCredits } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

const POLL_MS = 3000;
/** Au-delà, on arrête d'interroger : le webhook créditera quand même le compte. */
const WAIT_MS = 2 * 60 * 1000;

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
const primary =
  'inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700';
const secondary =
  'inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50';

function usePayment(id: string | undefined, polling: boolean) {
  return useQuery({
    queryKey: ['payment', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, status, credits, amount, currency')
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) =>
      polling && query.state.data?.status === 'pending' ? POLL_MS : false,
  });
}

function Icon({ tone, children }: { tone: 'ok' | 'wait' | 'ko'; children: ReactNode }) {
  const colors = {
    ok: 'bg-emerald-100 text-emerald-700',
    wait: 'bg-sky-100 text-sky-700',
    ko: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className={`grid h-12 w-12 place-items-center rounded-full ${colors[tone]}`}>
      {children}
    </div>
  );
}

export default function Paiement() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const [attempt, setAttempt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const payment = usePayment(id, !timedOut);
  const status = payment.data?.status;

  useEffect(() => {
    if (status !== 'pending') return;
    const timer = setTimeout(() => setTimedOut(true), WAIT_MS);
    return () => clearTimeout(timer);
  }, [status, attempt]);

  // Paiement confirmé : on relit le solde et l'historique, sans rien calculer ici.
  useEffect(() => {
    if (status === 'succeeded') refreshCredits(queryClient);
  }, [status, queryClient]);

  function checkAgain() {
    setTimedOut(false);
    setAttempt((a) => a + 1);
    void payment.refetch();
  }

  let content: ReactNode;
  if (payment.isPending) {
    content = (
      <div className="grid place-items-center py-10 text-sky-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  } else if (payment.isError) {
    content = (
      <>
        <h1 className="text-xl font-semibold text-slate-900">
          Impossible de vérifier ton paiement
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">Vérifie ta connexion, puis réessaie.</p>
        <button type="button" onClick={checkAgain} className={`${primary} mt-5`}>
          Réessayer
        </button>
      </>
    );
  } else if (!payment.data) {
    content = (
      <>
        <h1 className="text-xl font-semibold text-slate-900">Paiement introuvable</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Ce lien ne correspond à aucun paiement de ton compte.
        </p>
        <Link to="/compte" className={`${primary} mt-5`}>
          Voir mon compte
        </Link>
      </>
    );
  } else {
    const p = payment.data;
    const summary = (
      <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {formatCredits(p.credits)} · {formatPrice(Number(p.amount), p.currency)}
      </p>
    );

    if (p.status === 'succeeded') {
      const balance = profile.data?.credits_balance;
      content = (
        <>
          <Icon tone="ok">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
          </Icon>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Paiement confirmé</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {formatCredits(p.credits)} ajoutés à ton solde.
          </p>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-500">Nouveau solde</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
              {balance === undefined || profile.isFetching ? '…' : formatCredits(balance)}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link to="/audit" className={primary}>
              Aller à mon audit
            </Link>
            <Link to="/compte" className={secondary}>
              Voir mon compte
            </Link>
          </div>
        </>
      );
    } else if (p.status === 'pending') {
      content = timedOut ? (
        <>
          <Icon tone="wait">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-12.25a.75.75 0 0 0-1.5 0V10c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V5.75Z"
                clipRule="evenodd"
              />
            </svg>
          </Icon>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Confirmation en attente</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            SasPay n’a pas encore confirmé ton paiement. Tes crédits seront ajoutés automatiquement
            dès la confirmation : tu peux quitter cette page.
          </p>
          {summary}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={checkAgain} className={primary}>
              Vérifier à nouveau
            </button>
            <Link to="/compte" className={secondary}>
              Voir mon compte
            </Link>
          </div>
        </>
      ) : (
        <div role="status">
          <Icon tone="wait">
            <Spinner className="h-6 w-6" />
          </Icon>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Confirmation du paiement…</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            SasPay nous confirme ton paiement, cela prend en général quelques secondes.
          </p>
          {summary}
        </div>
      );
    } else {
      content = (
        <>
          <Icon tone="ko">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.25 6a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0V6ZM10 14.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
          </Icon>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            {p.status === 'refunded' ? 'Paiement remboursé' : 'Le paiement n’a pas abouti'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {p.status === 'refunded'
              ? 'Ce paiement a été remboursé : les crédits correspondants ne sont plus disponibles.'
              : 'Aucun crédit n’a été ajouté. Tu peux choisir un pack et réessayer.'}
          </p>
          {summary}
          <Link to="/compte" className={`${primary} mt-6`}>
            Choisir un pack
          </Link>
        </>
      );
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <section className={card}>{content}</section>
    </div>
  );
}
