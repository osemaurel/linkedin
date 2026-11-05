import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { ObjectiveStep } from '@/components/onboarding/ObjectiveStep';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { QuestionStep } from '@/components/onboarding/QuestionStep';
import { StepCard } from '@/components/onboarding/StepCard';
import { useOnboarding, type OnboardingState } from '@/hooks/useOnboarding';
import { objectiveLabel } from '@/lib/objectives';

type Step = 1 | 2 | 3;
const STEPS: Step[] = [1, 2, 3];
const TITLES: Record<Step, string> = {
  1: 'Ton profil LinkedIn',
  2: 'Ton objectif',
  3: 'Ta recherche',
};

function profileSummary(state: OnboardingState): string {
  if (state.source === 'none') {
    return 'Pas encore de compte LinkedIn : on construira ton profil ensemble.';
  }
  const parts = [state.source === 'pdf' ? 'PDF importé' : 'Profil collé'];
  if (state.headline) parts.push(state.headline);
  if (state.experiences > 0) {
    parts.push(`${state.experiences} expérience${state.experiences > 1 ? 's' : ''}`);
  }
  return parts.join(' · ');
}

export default function Demarrer() {
  const { data, isPending, isError, refetch } = useOnboarding();
  const [step, setStep] = useState<Step | null>(null);
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-sky-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>Impossible de charger ton profil.</p>
        <button type="button" onClick={() => void refetch()} className="mt-2 font-medium underline">
          Réessayer
        </button>
      </div>
    );
  }

  const done: Record<Step, boolean> = {
    1: data.source !== null,
    2: data.objective !== null,
    3: data.offer !== null,
  };
  // Reprise là où l'utilisateur s'était arrêté : première étape non faite.
  const current: Step = step ?? STEPS.find((n) => !done[n]) ?? 3;

  function advance(from: Step) {
    if (from === 3) {
      navigate('/audit');
      return;
    }
    setStep(STEPS.find((n) => n > from && !done[n]) ?? 3);
  }

  const summaries: Record<Step, string | null> = {
    1: done[1] ? profileSummary(data) : null,
    2: data.objective ? objectiveLabel(data.objective) : null,
    3: data.offer,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-sky-700">Étape {current} sur 3</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Faisons connaissance
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
        Trois étapes, moins de deux minutes. Ensuite, ton audit.
      </p>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {STEPS.map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full ${
              done[n] && n !== current
                ? 'bg-sky-600'
                : n === current
                  ? 'bg-sky-300'
                  : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <ol className="mt-6 space-y-3">
        {STEPS.map((n) => {
          const state = n === current ? 'current' : done[n] ? 'done' : 'upcoming';
          return (
            <li key={n}>
              <StepCard
                number={n}
                title={TITLES[n]}
                state={state}
                summary={summaries[n]}
                onEdit={() => setStep(n)}
              >
                {n === 1 && <ProfileStep onDone={() => advance(1)} />}
                {n === 2 && <ObjectiveStep value={data.objective} onDone={() => advance(2)} />}
                {n === 3 && (
                  <QuestionStep
                    objective={data.objective}
                    initial={data.offer}
                    onDone={() => advance(3)}
                  />
                )}
              </StepCard>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
