import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AutosaveField } from '@/components/profile/AutosaveField';
import { Spinner } from '@/components/Spinner';
import { PillarsEditor } from '@/components/strategy/PillarsEditor';
import { useAuth } from '@/hooks/useAuth';
import { useActionCost } from '@/hooks/usePricing';
import { useProfile } from '@/hooks/useProfile';
import { useRecharge } from '@/hooks/useRecharge';
import { formatCost, formatCredits, refreshCredits } from '@/lib/credits';
import { FunctionError } from '@/lib/edgeFunctions';
import { saveStrategic } from '@/lib/profileApi';
import { fetchStrategy, generateStrategy, type Strategy } from '@/lib/strategy';

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

function useStrategy() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['strategy', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchStrategy(userId as string),
  });
}

/** Bouton de génération : coût lu avant l'action, écran de recharge si le solde manque. */
function GenerateControl({
  label,
  confirm,
  onGenerated,
}: {
  label: string;
  confirm?: string;
  onGenerated: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const cost = useActionCost('pillars');
  const balance = useProfile().data?.credits_balance;
  const { canAfford, askRecharge, handleError } = useRecharge();

  const generate = useMutation({
    mutationFn: generateStrategy,
    onSuccess: async () => {
      refreshCredits(queryClient);
      await onGenerated();
    },
    onError: (e) => {
      if (handleError(e, 'pillars')) refreshCredits(queryClient);
    },
  });
  const error =
    generate.error instanceof FunctionError && generate.error.code === 'insufficient_credits'
      ? null
      : generate.error;

  function start() {
    if (confirm && !window.confirm(confirm)) return;
    if (!canAfford('pillars')) {
      generate.reset();
      askRecharge('pillars');
      return;
    }
    generate.mutate();
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={generate.isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {generate.isPending && <Spinner />}
        {generate.isPending ? 'Proposition en cours…' : label}
      </button>
      <p className="mt-1.5 text-xs text-slate-500">
        Coût : {cost === undefined ? '…' : formatCost(cost)} · solde :{' '}
        {balance === undefined ? '…' : formatCredits(balance)}
      </p>
      {generate.isPending && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          On construit ta stratégie à partir de ton profil et de ton objectif, une vingtaine de
          secondes.
        </p>
      )}
      {error && !generate.isPending && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}

function StrategyEditor({
  userId,
  initial,
  onRegenerated,
}: {
  userId: string;
  initial: Strategy;
  onRegenerated: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(initial);
  const patch = (p: Partial<Strategy>) => setDraft((d) => ({ ...d, ...p }));

  // Le cache suit les modifications : revenir sur la page n'affiche jamais un état ancien.
  useEffect(() => {
    queryClient.setQueryData(['strategy', userId], draft);
  }, [draft, queryClient, userId]);

  return (
    <>
      <section className={`${card} space-y-5`}>
        <AutosaveField
          label="Ton positionnement"
          hint="Une phrase : qui tu aides, à obtenir quoi, et ce qui te distingue."
          value={draft.positioning}
          multiline
          autoGrow
          rows={3}
          maxLength={240}
          showCount
          onChange={(positioning) => patch({ positioning })}
          onSave={(positioning) =>
            saveStrategic(userId, { positioning: positioning.trim() || null })
          }
        />
        <AutosaveField
          label="Ton audience"
          hint="Les lecteurs qui comptent pour ton objectif. C’est aussi l’audience de ton profil."
          value={draft.audience}
          multiline
          autoGrow
          rows={2}
          maxLength={300}
          onChange={(audience) => patch({ audience })}
          onSave={async (audience) => {
            await saveStrategic(userId, { target_audience: audience.trim() || null });
            void queryClient.invalidateQueries({ queryKey: ['full-profile'] });
          }}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Tes piliers de contenu
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Les 3 à 5 thèmes sur lesquels tu publieras régulièrement. Ajuste-les librement : tout est
          enregistré au fil de la frappe.
        </p>
        <div className="mt-3">
          <PillarsEditor
            userId={userId}
            pillars={draft.pillars}
            onChange={(pillars) => patch({ pillars })}
          />
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-slate-900">Repartir d’une nouvelle proposition</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Utile après avoir enrichi ton profil. Ton positionnement et tes piliers actuels seront
          remplacés ; ton audience est conservée.
        </p>
        <div className="mt-4">
          <GenerateControl
            label="Nouvelle proposition"
            confirm="Ton positionnement et tes piliers actuels seront remplacés par la nouvelle proposition. Continuer ?"
            onGenerated={onRegenerated}
          />
        </div>
      </section>

      <section
        className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <p className="text-sm text-slate-600">
          Prochaine étape : répartir ces piliers sur ton calendrier de publication.
        </p>
        <Link
          to="/plan"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voir mon plan éditorial
        </Link>
      </section>
    </>
  );
}

export default function Strategie() {
  const { user } = useAuth();
  const strategy = useStrategy();
  // Change après chaque nouvelle proposition : l'éditeur repart des données enregistrées.
  const [version, setVersion] = useState(0);

  async function reload() {
    await strategy.refetch();
    setVersion((v) => v + 1);
  }

  const header = (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Stratégie de contenu
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
        Ton positionnement, ton audience et les thèmes sur lesquels tu publieras.
      </p>
    </header>
  );

  let body;
  if (strategy.isPending) {
    body = (
      <div className="grid place-items-center py-16 text-brand-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  } else if (strategy.isError) {
    body = (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>Impossible de charger ta stratégie.</p>
        <button
          type="button"
          onClick={() => void strategy.refetch()}
          className="mt-2 font-medium underline"
        >
          Réessayer
        </button>
      </div>
    );
  } else if (!strategy.data.positioning && strategy.data.pillars.length === 0) {
    body = (
      <section className={card}>
        <h2 className="font-semibold text-slate-900">
          Ta stratégie, proposée à partir de ton profil
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Une phrase de positionnement, l’audience à toucher, et 3 à 5 piliers : les thèmes sur
          lesquels tu publieras régulièrement. Tu ajustes ensuite tout ce que tu veux.
        </p>
        <div className="mt-5">
          <GenerateControl label="Proposer ma stratégie" onGenerated={reload} />
        </div>
      </section>
    );
  } else {
    body = (
      <StrategyEditor
        key={version}
        userId={user?.id as string}
        initial={strategy.data}
        onRegenerated={reload}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {header}
      {body}
    </div>
  );
}
