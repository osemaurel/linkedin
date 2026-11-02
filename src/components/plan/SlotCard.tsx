import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AutosaveField } from '@/components/profile/AutosaveField';
import { Spinner } from '@/components/Spinner';
import { useActionCost } from '@/hooks/usePricing';
import { useRecharge } from '@/hooks/useRecharge';
import { formatCost, refreshCredits } from '@/lib/credits';
import {
  FORMAT_LABELS,
  FORMATS,
  formatShortDay,
  pillarColor,
  regenerateSlot,
  saveSlot,
  type PlanPillar,
  type PlanSlot,
} from '@/lib/plan';
import { inputClass } from '@/lib/ui';

type Props = {
  slot: PlanSlot;
  pillars: PlanPillar[];
  onChange: (patch: Partial<PlanSlot>) => void;
  /** Ouvert d'emblée (vue calendrier, jour sélectionné). */
  defaultOpen?: boolean;
};

const smallButton =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-60';

export function SlotCard({ slot, pillars, onChange, defaultOpen = false }: Props) {
  const queryClient = useQueryClient();
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const cost = useActionCost('plan_slot');
  const { canAfford, askRecharge, handleError } = useRecharge();
  const pillar = pillars.find((p) => p.id === slot.pillarId);
  const color = pillarColor(pillars, slot.pillarId);

  async function update(patch: Partial<PlanSlot>, db: Parameters<typeof saveSlot>[1]) {
    setError(null);
    const previous = { ...slot };
    onChange(patch);
    try {
      await saveSlot(slot.id, db);
    } catch (e) {
      onChange(previous);
      setError((e as Error).message);
    }
  }

  const fresh = useMutation({
    mutationFn: () => regenerateSlot(slot.id),
    onSuccess: (next) => {
      onChange(next);
      refreshCredits(queryClient);
    },
    onError: (e) => {
      if (handleError(e, 'plan_slot')) refreshCredits(queryClient);
      else setError(e.message);
    },
  });

  function newAngle() {
    setError(null);
    if (!canAfford('plan_slot')) return askRecharge('plan_slot');
    fresh.mutate();
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="inline-block text-sm font-semibold text-slate-900 first-letter:uppercase">
          {formatShortDay(slot.date)}
        </span>
        <span className={`rounded-full px-2 py-0.5 ${color.chip}`}>
          {pillar?.name ?? 'Sans pilier'}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          {FORMAT_LABELS[slot.format]}
        </span>
      </div>

      {open ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor={`${id}-date`}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Date
              </label>
              <input
                id={`${id}-date`}
                type="date"
                value={slot.date}
                onChange={(e) =>
                  e.target.value &&
                  void update({ date: e.target.value }, { scheduled_date: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-pillar`}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Pilier
              </label>
              <select
                id={`${id}-pillar`}
                value={slot.pillarId ?? ''}
                onChange={(e) => {
                  const pillarId = e.target.value || null;
                  void update({ pillarId }, { pillar_id: pillarId });
                }}
                className={inputClass}
              >
                {!slot.pillarId && <option value="">Sans pilier</option>}
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || 'Pilier sans nom'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`${id}-format`}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Format
              </label>
              <select
                id={`${id}-format`}
                value={slot.format}
                onChange={(e) => {
                  const format = e.target.value as PlanSlot['format'];
                  void update({ format }, { format });
                }}
                className={inputClass}
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AutosaveField
            label="Angle"
            hint="L’idée précise du post, en une phrase."
            value={slot.angle}
            multiline
            autoGrow
            rows={2}
            maxLength={200}
            onChange={(angle) => onChange({ angle })}
            onSave={(angle) => saveSlot(slot.id, { angle: angle.trim() || null })}
          />
        </div>
      ) : (
        <p className="mt-2 text-slate-800">
          {slot.angle || <em className="text-slate-500">Sans angle</em>}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <button type="button" onClick={() => setOpen((o) => !o)} className={smallButton}>
          {open ? 'Fermer' : 'Modifier'}
        </button>
        <button type="button" onClick={newAngle} disabled={fresh.isPending} className={smallButton}>
          {fresh.isPending && <Spinner />}
          {fresh.isPending ? 'Nouvel angle…' : 'Nouvel angle'}
          {cost !== undefined && !fresh.isPending && (
            <span className="font-normal text-slate-500">· {formatCost(cost)}</span>
          )}
        </button>
      </div>
    </article>
  );
}
