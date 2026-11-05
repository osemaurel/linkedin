import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlanCalendar } from '@/components/plan/PlanCalendar';
import { PlanList } from '@/components/plan/PlanList';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useActionCost } from '@/hooks/usePricing';
import { useProfile } from '@/hooks/useProfile';
import { useRecharge } from '@/hooks/useRecharge';
import { formatCost, formatCredits, refreshCredits } from '@/lib/credits';
import { FunctionError } from '@/lib/edgeFunctions';
import {
  FORMAT_LABELS,
  FORMATS,
  fetchPlan,
  formatDayMonth,
  generatePlan,
  HORIZONS,
  RHYTHMS,
  type Horizon,
  type PlanData,
  type PlanSlot,
  type Rhythm,
} from '@/lib/plan';

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

function usePlan() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['plan', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchPlan(userId as string),
    staleTime: 0,
  });
}

/** Choix exclusif présenté en boutons : deux clics, jamais de formulaire. */
function Choice<T extends number>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <p id={id} className="mb-1.5 text-sm font-medium text-slate-700">
        {label}
      </p>
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={o === value}
            onClick={() => onChange(o)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              o === value
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {render(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Horizon, rythme, coût lu avant l'action ; écran de recharge si le solde manque. */
function CreatePlan({
  replacing,
  onCreated,
}: {
  replacing: boolean;
  onCreated: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [horizon, setHorizon] = useState<Horizon>(30);
  const [rhythm, setRhythm] = useState<Rhythm>(2);
  const cost = useActionCost('content_plan');
  const balance = useProfile().data?.credits_balance;
  const { canAfford, askRecharge, handleError } = useRecharge();

  const create = useMutation({
    mutationFn: () => generatePlan(horizon, rhythm),
    onSuccess: async () => {
      refreshCredits(queryClient);
      await onCreated();
    },
    onError: (e) => {
      if (handleError(e, 'content_plan')) refreshCredits(queryClient);
    },
  });
  const error =
    create.error instanceof FunctionError && create.error.code === 'insufficient_credits'
      ? null
      : create.error;

  function start() {
    if (
      replacing &&
      !window.confirm('Ton plan actuel et tous ses créneaux seront remplacés. Continuer ?')
    ) {
      return;
    }
    if (!canAfford('content_plan')) {
      create.reset();
      askRecharge('content_plan');
      return;
    }
    create.mutate();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Choice
          label="Durée"
          options={HORIZONS}
          value={horizon}
          onChange={setHorizon}
          render={(h) => `${h} jours`}
        />
        <Choice
          label="Rythme"
          options={RHYTHMS}
          value={rhythm}
          onChange={setRhythm}
          render={(r) => `${r} posts / semaine`}
        />
      </div>
      <div>
        <button
          type="button"
          onClick={start}
          disabled={create.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {create.isPending && <Spinner />}
          {create.isPending
            ? 'Préparation du plan…'
            : replacing
              ? 'Créer un nouveau plan'
              : 'Créer mon plan'}
        </button>
        <p className="mt-1.5 text-xs text-slate-500">
          Coût : {cost === undefined ? '…' : formatCost(cost)} · solde :{' '}
          {balance === undefined ? '…' : formatCredits(balance)}
        </p>
      </div>
      {create.isPending && (
        <p role="status" className="text-sm text-slate-600">
          On répartit tes piliers sur le calendrier et on trouve un angle pour chaque publication,
          une quinzaine de secondes.
        </p>
      )}
      {error && !create.isPending && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}

function PlanEditor({
  initial,
  onRecreated,
}: {
  initial: PlanData;
  onRecreated: () => Promise<void>;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState(initial.slots);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const change = (id: string, patch: Partial<PlanSlot>) =>
    setSlots((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Le cache suit les modifications : revenir sur la page n'affiche jamais un état ancien.
  useEffect(() => {
    queryClient.setQueryData<PlanData>(['plan', user?.id], (d) => (d ? { ...d, slots } : d));
  }, [slots, queryClient, user?.id]);

  const dates = slots.map((s) => s.date).sort();
  const counts = FORMATS.map((f) => ({
    label: FORMAT_LABELS[f.value].toLowerCase(),
    n: slots.filter((s) => s.format === f.value).length,
  })).filter((c) => c.n);

  return (
    <>
      <section
        className={`${card} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div>
          <p className="font-semibold text-slate-900">
            {slots.length} publication{slots.length > 1 ? 's' : ''} sur {initial.plan?.horizon}{' '}
            jours
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {dates.length
              ? `Du ${formatDayMonth(dates[0])} au ${formatDayMonth(dates.at(-1)!)}`
              : ''}
            {counts.length
              ? ` · ${counts.map((c) => `${c.n} ${c.label}${c.n > 1 ? 's' : ''}`).join(', ')}`
              : ''}
          </p>
        </div>
        <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-1 sm:self-auto">
          {(
            [
              ['list', 'Liste'],
              ['calendar', 'Calendrier'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === v
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {view === 'list' ? (
        <PlanList slots={slots} pillars={initial.pillars} onChange={change} />
      ) : (
        <PlanCalendar slots={slots} pillars={initial.pillars} onChange={change} />
      )}

      <section className={card}>
        <h2 className="font-semibold text-slate-900">Repartir d’un nouveau plan</h2>
        <p className="mb-4 mt-1.5 text-sm text-slate-600">
          Utile après avoir modifié tes piliers. Le plan actuel et ses créneaux seront remplacés.
        </p>
        <CreatePlan replacing onCreated={onRecreated} />
      </section>

      <p className="text-sm text-slate-500">
        Prochaine étape : rédiger chaque publication avec « Rédiger dans le Studio », sur son
        créneau.
      </p>
    </>
  );
}

export default function PlanEditorial() {
  const plan = usePlan();
  // Change après chaque nouveau plan : l'éditeur repart des données enregistrées.
  const [version, setVersion] = useState(0);

  async function reload() {
    await plan.refetch();
    setVersion((v) => v + 1);
  }

  const header = (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Plan éditorial
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
        Ton calendrier de publication : chaque créneau a sa date, son pilier, son format et son
        angle.
      </p>
    </header>
  );

  let body;
  if (plan.isPending) {
    body = (
      <div className="grid place-items-center py-16 text-blue-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  } else if (plan.isError) {
    body = (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>Impossible de charger ton plan.</p>
        <button
          type="button"
          onClick={() => void plan.refetch()}
          className="mt-2 font-medium underline"
        >
          Réessayer
        </button>
      </div>
    );
  } else if (!plan.data.pillars.length) {
    body = (
      <section className={card}>
        <h2 className="font-semibold text-slate-900">Ton plan part de tes piliers de contenu</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Définis d’abord les thèmes sur lesquels tu veux publier : on les répartira ensuite sur ton
          calendrier.
        </p>
        <Link
          to="/strategie"
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Définir ma stratégie
        </Link>
      </section>
    );
  } else if (!plan.data.plan || !plan.data.slots.length) {
    body = (
      <section className={card}>
        <h2 className="font-semibold text-slate-900">Ton calendrier, construit sur tes piliers</h2>
        <p className="mb-4 mt-1.5 text-sm text-slate-600">
          Choisis une durée et un rythme : chaque publication reçoit une date, un pilier, un format
          et un angle précis. Tu ajustes ensuite ce que tu veux.
        </p>
        <CreatePlan replacing={false} onCreated={reload} />
      </section>
    );
  } else {
    body = <PlanEditor key={version} initial={plan.data} onRecreated={reload} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {header}
      {body}
    </div>
  );
}
