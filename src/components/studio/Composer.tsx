import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
import { useActionCost } from '@/hooks/usePricing';
import { useProfile } from '@/hooks/useProfile';
import { useRecharge } from '@/hooks/useRecharge';
import { formatCost, formatCredits, refreshCredits } from '@/lib/credits';
import { FunctionError } from '@/lib/edgeFunctions';
import { FORMAT_LABELS, formatShortDay } from '@/lib/plan';
import { MAX_INSTRUCTION, TONES, writePost, type SlotInfo, type Tone } from '@/lib/studio';
import { inputClass } from '@/lib/ui';

type Props = {
  upcoming: SlotInfo[];
  /** Créneau choisi depuis le plan (?slot=…), même s'il n'est plus dans les prochains. */
  preselected: SlotInfo | null;
  onWritten: (postId: string) => Promise<void>;
};

const FREE = 'libre';

export function Composer({ upcoming, preselected, onWritten }: Props) {
  const id = useId();
  const queryClient = useQueryClient();
  const slots =
    preselected && !upcoming.some((s) => s.id === preselected.id)
      ? [preselected, ...upcoming]
      : upcoming;
  const [target, setTarget] = useState<string>(preselected?.id ?? slots[0]?.id ?? FREE);
  const [subject, setSubject] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [instruction, setInstruction] = useState('');
  const cost = useActionCost('post');
  const balance = useProfile().data?.credits_balance;
  const { canAfford, askRecharge, handleError } = useRecharge();

  const write = useMutation({
    mutationFn: () =>
      writePost(
        target === FREE
          ? { subject: subject.trim(), tone, instruction: instruction.trim() }
          : { slotId: target, tone, instruction: instruction.trim() },
      ),
    onSuccess: async ({ post_id }) => {
      refreshCredits(queryClient);
      setInstruction('');
      setSubject('');
      await onWritten(post_id);
    },
    onError: (e) => {
      if (handleError(e, 'post')) refreshCredits(queryClient);
    },
  });
  const error =
    write.error instanceof FunctionError && write.error.code === 'insufficient_credits'
      ? null
      : write.error;
  const ready = target !== FREE || subject.trim().length > 0;

  function start() {
    if (!ready) return;
    if (!canAfford('post')) {
      write.reset();
      askRecharge('post');
      return;
    }
    write.mutate();
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">
          Pour quelle publication ?
        </legend>
        <div className="space-y-2">
          {slots.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
                target === s.id
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name={`${id}-target`}
                value={s.id}
                checked={target === s.id}
                onChange={() => setTarget(s.id)}
                className="mt-1 accent-brand-600"
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-500">
                  <span className="inline-block first-letter:uppercase">
                    {formatShortDay(s.date)}
                  </span>
                  {s.pillarName ? ` · ${s.pillarName}` : ''} · {FORMAT_LABELS[s.format]}
                </span>
                <span className="mt-0.5 block text-slate-900">{s.angle || 'Sans angle'}</span>
              </span>
            </label>
          ))}
          <label
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
              target === FREE
                ? 'border-brand-400 bg-brand-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name={`${id}-target`}
              value={FREE}
              checked={target === FREE}
              onChange={() => setTarget(FREE)}
              className="mt-1 accent-brand-600"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-slate-900">Sujet libre</span>
              {target === FREE && (
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={300}
                  placeholder="Ex. : ce que j’ai appris de ma première mission en PME"
                  aria-label="Sujet du post"
                  className={`${inputClass} mt-2`}
                />
              )}
            </span>
          </label>
        </div>
        {slots.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Aucun créneau à venir dans ton plan.{' '}
            <Link to="/plan" className="font-medium text-brand-700 hover:underline">
              Voir mon plan éditorial
            </Link>
          </p>
        )}
      </fieldset>

      <div role="radiogroup" aria-labelledby={`${id}-tone`}>
        <p id={`${id}-tone`} className="mb-1.5 text-sm font-medium text-slate-700">
          Ton
        </p>
        <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-1">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={tone === t.value}
              onClick={() => setTone(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tone === t.value
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor={`${id}-instruction`}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Consigne pour ce post <span className="font-normal text-slate-500">(facultatif)</span>
        </label>
        <input
          id={`${id}-instruction`}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          maxLength={MAX_INSTRUCTION}
          placeholder="Ex. : commence par une anecdote client"
          className={inputClass}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={start}
          disabled={write.isPending || !ready}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {write.isPending && <Spinner />}
          {write.isPending ? 'Rédaction en cours…' : 'Rédiger le post'}
        </button>
        <p className="mt-1.5 text-xs text-slate-500">
          Coût : {cost === undefined ? '…' : formatCost(cost)} · solde :{' '}
          {balance === undefined ? '…' : formatCredits(balance)}
        </p>
      </div>
      {write.isPending && (
        <p role="status" className="text-sm text-slate-600">
          On écrit ton post dans ta voix, une dizaine de secondes.
        </p>
      )}
      {error && !write.isPending && (
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
