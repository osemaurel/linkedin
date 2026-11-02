import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BlockCard } from '@/components/audit/BlockCard';
import { QuestionPrompt, type QuestionOutcome } from '@/components/audit/QuestionPrompt';
import { QuickWins } from '@/components/audit/QuickWins';
import { RunAuditControl } from '@/components/audit/RunAuditControl';
import { BigScore, Delta, ScoreBadge } from '@/components/audit/Score';
import { Spinner } from '@/components/Spinner';
import { useAudits } from '@/hooks/useAudits';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useActionCost } from '@/hooks/usePricing';
import { useProfile } from '@/hooks/useProfile';
import { useRecharge } from '@/hooks/useRecharge';
import { BLOCK_LABELS, BLOCKS, runAudit, type Block } from '@/lib/audit';
import { refreshCredits } from '@/lib/credits';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

export default function Audit() {
  const onboarding = useOnboarding();
  const audits = useAudits();
  const profile = useProfile();
  const auditCost = useActionCost('audit');
  const { canAfford, askRecharge, handleError } = useRecharge();
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<{ block: Block; outcome: QuestionOutcome } | null>(null);

  const run = useMutation({
    mutationFn: runAudit,
    onSuccess: async () => {
      setOutcome(null);
      refreshCredits(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
    onError: (error) => {
      if (handleError(error, 'audit')) refreshCredits(queryClient);
    },
  });

  function launchAudit() {
    if (!canAfford('audit')) {
      run.reset();
      askRecharge('audit');
      return;
    }
    run.mutate();
  }

  if (onboarding.isPending || audits.isPending) {
    return (
      <div className="grid place-items-center py-24 text-sky-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (onboarding.isError || audits.isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>Impossible de charger ton audit.</p>
        <button
          type="button"
          onClick={() => {
            void onboarding.refetch();
            void audits.refetch();
          }}
          className="mt-2 font-medium underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const header = (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Audit & optimisation
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
        Chaque bloc de ton profil noté selon ton objectif, avec des versions prêtes à copier.
      </p>
    </header>
  );

  if (onboarding.data.source === null || onboarding.data.objective === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {header}
        <section className={card}>
          <h2 className="font-semibold text-slate-900">Présente d’abord ton profil</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            L’audit part de ton profil LinkedIn et de ton objectif. Deux minutes suffisent.
          </p>
          <Link
            to="/demarrer"
            className="mt-4 inline-flex items-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Présenter mon profil
          </Link>
        </section>
      </div>
    );
  }

  const { latest, previous, suggestions, question } = audits.data;
  const control = (
    <RunAuditControl
      hasAudit={latest !== null}
      cost={auditCost}
      balance={profile.data?.credits_balance}
      pending={run.isPending}
      error={run.error}
      onRun={launchAudit}
    />
  );

  if (!latest) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {header}
        <section className={card}>
          <h2 className="font-semibold text-slate-900">Ton premier audit</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            On note chaque bloc de ton profil et, pour chaque point faible, on te propose deux ou
            trois versions réécrites, prêtes à coller sur LinkedIn.
          </p>
          <div className="mt-5">{control}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {header}

      <section className={card}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-500">Score global</h2>
            <BigScore score={latest.scoreGlobal} />
            <p className="mt-1 text-sm text-slate-600">
              {previous ? (
                <>
                  <Delta
                    current={latest.scoreGlobal}
                    previous={previous.scoreGlobal}
                    srContext={false}
                  />{' '}
                  depuis l’audit précédent
                </>
              ) : (
                'Ton premier audit'
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Audit du {dateFormat.format(new Date(latest.createdAt))}
            </p>
          </div>
          {control}
        </div>

        <ul className="mt-5 grid gap-x-8 gap-y-2.5 border-t border-slate-100 pt-4 sm:grid-cols-2">
          {BLOCKS.map((block) => (
            <li key={block} className="flex items-center justify-between gap-3 text-sm">
              <a href={`#bloc-${block}`} className="text-slate-700 hover:text-sky-700">
                {BLOCK_LABELS[block]}
              </a>
              <span className="flex items-center gap-2">
                <Delta
                  current={latest.blocks[block].score}
                  previous={previous?.blocks[block].score}
                />
                <ScoreBadge score={latest.blocks[block].score} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {latest.quickWins.length > 0 && <QuickWins wins={latest.quickWins} />}

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Bloc par bloc</h2>
        <p className="mt-1 text-sm text-slate-600">
          Photo, bannière et sélection n’apparaissent pas dans l’export de ton profil : vérifie-les
          toi-même avec nos conseils.
        </p>
        <div className="mt-3 space-y-3">
          {BLOCKS.map((block) => (
            <BlockCard
              key={`${latest.id}-${block}`}
              block={block}
              result={latest.blocks[block]}
              previous={previous?.blocks[block]}
              rewrites={suggestions.filter((s) => s.block === block)}
              question={
                question?.block === block ? (
                  <QuestionPrompt
                    key={question.id}
                    question={question}
                    onOutcome={(o) => setOutcome({ block, outcome: o })}
                  />
                ) : undefined
              }
              outcome={outcome?.block === block ? outcome.outcome : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
