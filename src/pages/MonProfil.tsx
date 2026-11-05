import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AutosaveField, SaveIndicator } from '@/components/profile/AutosaveField';
import { ExperiencesEditor } from '@/components/profile/ExperiencesEditor';
import { ProofsEditor } from '@/components/profile/ProofsEditor';
import { SkillsEditor } from '@/components/profile/SkillsEditor';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useAutosave } from '@/hooks/useAutosave';
import { useFullProfile, type FullProfile } from '@/hooks/useFullProfile';
import { computeCompleteness, type ProfileTab } from '@/lib/completeness';
import { OBJECTIVES, type Objective } from '@/lib/objectives';
import { saveProfile, saveStrategic } from '@/lib/profileApi';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'donnees', label: 'Données LinkedIn' },
  { id: 'contexte', label: 'Contexte' },
  { id: 'preuves', label: 'Preuves' },
];

const AUDIENCE_EXAMPLES: Record<Objective, string> = {
  job: 'Ex. : recruteurs et DAF du secteur bancaire à Abidjan',
  clients: 'Ex. : dirigeants de PME de distribution en Côte d’Ivoire',
  visibility: 'Ex. : entrepreneurs de la tech au Sénégal',
};

function CompletenessCard({
  percent,
  next,
  onGo,
}: {
  percent: number;
  next: { hint: string; tab: ProfileTab } | null;
  onGo: (tab: ProfileTab) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-slate-600">Profil complété</h2>
        <span className="text-lg font-semibold tabular-nums text-slate-900">{percent} %</span>
      </div>
      <div
        role="progressbar"
        aria-label="Complétude du profil"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-2 rounded-full bg-slate-100"
      >
        <div
          className="h-2 rounded-full bg-sky-600 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {next ? (
          <>
            Prochaine étape :{' '}
            <button
              type="button"
              onClick={() => onGo(next.tab)}
              className="text-left font-medium text-sky-700 hover:underline"
            >
              {next.hint}
            </button>
          </>
        ) : (
          'Ton profil est complet.'
        )}{' '}
        <span className="text-slate-500">Rien n’est obligatoire.</span>
      </p>
    </section>
  );
}

function ObjectivePicker({
  value,
  onChange,
  onSave,
}: {
  value: Objective | null;
  onChange: (objective: Objective) => void;
  onSave: (objective: Objective) => Promise<void>;
}) {
  const { status, schedule, flush } = useAutosave(onSave, 0);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-700">Ton objectif</h3>
        <SaveIndicator status={status} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {OBJECTIVES.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => {
              onChange(o.value);
              schedule(o.value);
              flush();
            }}
            className={[
              'rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors',
              value === o.value
                ? 'border-sky-500 bg-sky-50 text-sky-800'
                : 'border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-slate-50',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileEditor({ initial }: { initial: FullProfile }) {
  const { user } = useAuth();
  const userId = user?.id as string;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(initial);
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('onglet'))?.id ?? 'donnees';
  const setTab = (next: ProfileTab) => setParams({ onglet: next }, { replace: true });
  const patch = (p: Partial<FullProfile>) => setDraft((d) => ({ ...d, ...p }));
  const { percent, next } = computeCompleteness(draft);

  // Le cache suit les modifications : revenir sur la page ne fait rien perdre.
  useEffect(() => {
    queryClient.setQueryData(['full-profile', userId], draft);
  }, [draft, queryClient, userId]);

  useEffect(
    () => () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    [queryClient],
  );

  const lastCompleteness = useRef(initial.completeness);
  const { schedule: scheduleCompleteness } = useAutosave(
    (completeness: number) => saveStrategic(userId, { completeness }),
    1500,
  );
  useEffect(() => {
    if (percent !== lastCompleteness.current) {
      lastCompleteness.current = percent;
      scheduleCompleteness(percent);
    }
  }, [percent, scheduleCompleteness]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Mon profil
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          Modifie ce que tu veux : tout s’enregistre automatiquement.
        </p>
      </header>

      <CompletenessCard percent={percent} next={next} onGo={setTab} />

      <div>
        <div
          role="tablist"
          aria-label="Sections du profil"
          className="flex gap-1 overflow-x-auto border-b border-slate-200"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`onglet-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panneau-${t.id}`}
              onClick={() => setTab(t.id)}
              className={[
                'inline-flex h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panneau-${tab}`}
          aria-labelledby={`onglet-${tab}`}
          className="space-y-6 pt-5"
        >
          {tab === 'donnees' && (
            <>
              <AutosaveField
                label="Nom complet"
                value={draft.fullName}
                onChange={(fullName) => patch({ fullName })}
                onSave={(v) => saveProfile(userId, { full_name: v.trim() || null })}
              />
              <AutosaveField
                label="Titre"
                hint="La ligne affichée sous ton nom."
                maxLength={220}
                showCount
                value={draft.headline}
                onChange={(headline) => patch({ headline })}
                onSave={(v) => saveStrategic(userId, { headline: v.trim() || null })}
              />
              <AutosaveField
                multiline
                rows={8}
                label="Infos"
                maxLength={2600}
                showCount
                value={draft.about}
                onChange={(about) => patch({ about })}
                onSave={(v) => saveStrategic(userId, { about: v.trim() || null })}
              />
              <ExperiencesEditor
                userId={userId}
                experiences={draft.experiences}
                onChange={(experiences) => patch({ experiences })}
              />
              <SkillsEditor
                skills={draft.skills}
                onChange={(skills) => patch({ skills })}
                onSave={(skills) => saveStrategic(userId, { skills })}
              />
              <p className="text-sm text-slate-600">
                Ton profil LinkedIn a changé ?{' '}
                <Link to="/demarrer" className="font-medium text-sky-700 hover:underline">
                  Importe-le à nouveau
                </Link>
              </p>
            </>
          )}

          {tab === 'contexte' && (
            <>
              <ObjectivePicker
                value={draft.objective}
                onChange={(objective) => patch({ objective })}
                onSave={(objective) => saveProfile(userId, { objective })}
              />
              <AutosaveField
                multiline
                rows={3}
                maxLength={500}
                label="Ce que tu cherches concrètement"
                hint="Ne peut pas rester vide : l’audit s’appuie dessus."
                value={draft.offer}
                onChange={(offer) => patch({ offer })}
                onSave={async (v) => {
                  if (v.trim()) await saveStrategic(userId, { offer: v.trim() });
                }}
              />
              <AutosaveField
                label="À qui tu t’adresses"
                placeholder={draft.objective ? AUDIENCE_EXAMPLES[draft.objective] : undefined}
                maxLength={200}
                value={draft.targetAudience}
                onChange={(targetAudience) => patch({ targetAudience })}
                onSave={(v) => saveStrategic(userId, { target_audience: v.trim() || null })}
              />
              <AutosaveField
                label="Pays"
                maxLength={80}
                value={draft.country}
                onChange={(country) => patch({ country })}
                onSave={(v) => saveProfile(userId, { country: v.trim() || null })}
              />
            </>
          )}

          {tab === 'preuves' && (
            <>
              <p className="text-sm text-slate-600">
                Tes résultats, chiffres et réalisations. L’audit s’en sert pour écrire à ta place,
                sans rien inventer.
              </p>
              <ProofsEditor
                userId={userId}
                proofs={draft.proofs}
                onChange={(proofs) => patch({ proofs })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonProfil() {
  const { data, isPending, isError, refetch } = useFullProfile();

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
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>Impossible de charger ton profil.</p>
        <button type="button" onClick={() => void refetch()} className="mt-2 font-medium underline">
          Réessayer
        </button>
      </div>
    );
  }

  return <ProfileEditor initial={data} />;
}
