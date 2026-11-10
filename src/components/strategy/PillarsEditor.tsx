import { useState } from 'react';
import { FormError } from '@/components/fields';
import { AutosaveField } from '@/components/profile/AutosaveField';
import {
  addPillar,
  deletePillar,
  MAX_PILLARS,
  MIN_PILLARS,
  savePillar,
  savePillarOrder,
  type StrategyPillar,
} from '@/lib/strategy';

type Props = {
  userId: string;
  pillars: StrategyPillar[];
  onChange: (pillars: StrategyPillar[]) => void;
};

const iconButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30';

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path
        d={up ? 'M5 12l5-5 5 5' : 'M5 8l5 5 5-5'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PillarsEditor({ userId, pillars, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (id: string, patch: Partial<StrategyPillar>) =>
    onChange(pillars.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const add = () =>
    run(async () => {
      const pillar = await addPillar(userId, pillars.length);
      onChange([...pillars, pillar]);
    });

  const remove = (pillar: StrategyPillar) => {
    const name = pillar.name.trim() ? `« ${pillar.name.trim()} »` : 'ce pilier';
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    void run(async () => {
      await deletePillar(pillar.id);
      onChange(pillars.filter((p) => p.id !== pillar.id));
    });
  };

  const move = (index: number, delta: -1 | 1) =>
    run(async () => {
      const next = [...pillars];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      onChange(next);
      await savePillarOrder(next);
    });

  return (
    <div className="space-y-3">
      {pillars.map((pillar, index) => (
        <fieldset
          key={pillar.id}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <legend className="sr-only">Pilier {index + 1}</legend>
          <div className="flex items-center justify-between gap-2">
            <span aria-hidden="true" className="text-sm font-semibold text-brand-700">
              Pilier {index + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => void move(index, -1)}
                disabled={busy || index === 0}
                aria-label={`Monter le pilier ${index + 1}`}
                className={iconButton}
              >
                <Arrow up />
              </button>
              <button
                type="button"
                onClick={() => void move(index, 1)}
                disabled={busy || index === pillars.length - 1}
                aria-label={`Descendre le pilier ${index + 1}`}
                className={iconButton}
              >
                <Arrow />
              </button>
              <button
                type="button"
                onClick={() => remove(pillar)}
                disabled={busy}
                className="ml-1 rounded-md px-2 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
          <AutosaveField
            label="Nom du pilier"
            placeholder="Ex. : Pilotage des marges"
            value={pillar.name}
            maxLength={60}
            onChange={(name) => update(pillar.id, { name })}
            onSave={(name) => savePillar(pillar.id, { name: name.trim() })}
          />
          <AutosaveField
            label="Ce que tu y racontes"
            placeholder="Les sujets de ces posts, et ce qu’ils t’apportent pour ton objectif."
            value={pillar.description}
            multiline
            autoGrow
            rows={3}
            maxLength={320}
            onChange={(description) => update(pillar.id, { description })}
            onSave={(description) =>
              savePillar(pillar.id, { description: description.trim() || null })
            }
          />
        </fieldset>
      ))}

      {pillars.length > 0 && pillars.length < MIN_PILLARS && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          Garde au moins {MIN_PILLARS} piliers : c’est ce qui permet de varier tes publications.
        </p>
      )}
      <FormError message={error} />
      {pillars.length < MAX_PILLARS ? (
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy}
          className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-400 hover:text-brand-700 disabled:opacity-60 sm:w-auto"
        >
          + Ajouter un pilier
        </button>
      ) : (
        <p className="text-sm text-slate-500">
          {MAX_PILLARS} piliers au maximum : au-delà, tes publications perdent leur fil.
        </p>
      )}
    </div>
  );
}
