import type { ReactNode } from 'react';
import { PackList } from '@/components/credits/PackList';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useCreditHistory, type CreditMovement } from '@/hooks/useCreditHistory';
import { usePricing, type Pricing } from '@/hooks/usePricing';
import { useProfile } from '@/hooks/useProfile';
import { formatCost, formatCredits } from '@/lib/credits';

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const numberFormat = new Intl.NumberFormat('fr-FR');

const REASON_LABELS: Record<CreditMovement['reason'], string> = {
  signup_grant: 'Crédits offerts à l’inscription',
  purchase: 'Recharge',
  generation_debit: 'Utilisation de crédits',
  refund: 'Remboursement',
  manual_adjust: 'Ajustement par l’équipe',
};

/** Un débit porte le libellé de l'action, tel que le serveur le décrit. */
function movementLabel(movement: CreditMovement, pricing: Pricing | undefined): string {
  if (movement.reason === 'generation_debit' && movement.kind) {
    const action = pricing?.actions.find((a) => a.kind === movement.kind);
    if (action) return action.label;
  }
  return REASON_LABELS[movement.reason];
}

function signed(delta: number): string {
  return `${delta > 0 ? '+' : '−'}${numberFormat.format(Math.abs(delta))}`;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>Impossible de charger {what}.</p>
      <button type="button" onClick={onRetry} className="mt-1 font-medium underline">
        Réessayer
      </button>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center py-8 text-sky-600" role="status">
      <Spinner className="h-5 w-5" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

function History({ pricing }: { pricing: Pricing | undefined }) {
  const history = useCreditHistory();

  if (history.isPending) return <Loading />;
  if (history.isError) {
    return <LoadError what="ton historique" onRetry={() => void history.refetch()} />;
  }
  if (history.data.length === 0) {
    return (
      <p className={`${card} text-sm text-slate-600`}>
        Aucun mouvement pour l’instant. Chaque crédit gagné ou utilisé apparaîtra ici.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      {history.data.map((m) => (
        <li key={m.id} className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{movementLabel(m, pricing)}</p>
            <p className="text-xs text-slate-500">
              <time dateTime={m.createdAt}>{dateFormat.format(new Date(m.createdAt))}</time>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`font-semibold tabular-nums ${m.delta > 0 ? 'text-emerald-700' : 'text-slate-900'}`}
            >
              <span aria-hidden="true">{signed(m.delta)}</span>
              <span className="sr-only">
                {m.delta > 0 ? 'Crédit de ' : 'Débit de '}
                {formatCredits(Math.abs(m.delta))}
              </span>
            </p>
            <p className="text-xs text-slate-500">Solde : {formatCredits(m.balanceAfter)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Compte() {
  const { user } = useAuth();
  const profile = useProfile();
  const pricing = usePricing();
  const balance = profile.data?.credits_balance;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Compte</h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          Ton solde, les recharges et l’historique de tes crédits.
        </p>
      </header>

      <section className={card} aria-labelledby="solde-titre">
        <h2 id="solde-titre" className="text-sm font-medium text-slate-500">
          Solde
        </h2>
        {profile.isError ? (
          <div className="mt-2">
            <LoadError what="ton solde" onRetry={() => void profile.refetch()} />
          </div>
        ) : (
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
            {balance === undefined ? '…' : numberFormat.format(balance)}
            <span className="ml-2 text-base font-normal text-slate-500">
              {balance === undefined || Math.abs(balance) > 1 ? 'crédits' : 'crédit'}
            </span>
          </p>
        )}
        {user?.email && <p className="mt-1 text-xs text-slate-500">{user.email}</p>}

        {pricing.data && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-medium text-slate-700">Ce que coûte chaque action</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              {pricing.data.actions.map((a) => (
                <div key={a.kind} className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-600">{a.label}</dt>
                  <dd className="shrink-0 font-medium tabular-nums text-slate-900">
                    {formatCost(a.cost)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <Section
        title="Recharger"
        hint="Pas d’abonnement ni de prélèvement automatique : tu recharges quand tu en as besoin."
      >
        {pricing.isPending ? (
          <Loading />
        ) : pricing.isError ? (
          <LoadError what="les packs" onRetry={() => void pricing.refetch()} />
        ) : (
          <PackList packs={pricing.data.packs} />
        )}
      </Section>

      <Section title="Historique">
        <History pricing={pricing.data} />
      </Section>
    </div>
  );
}
