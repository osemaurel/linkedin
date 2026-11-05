import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
import { useActionCost } from '@/hooks/usePricing';
import { useRecharge } from '@/hooks/useRecharge';
import { ANSWER_SAVED_CODES, answerQuestion, type AuditQuestion } from '@/lib/audit';
import { formatCost, refreshCredits } from '@/lib/credits';
import { FunctionError } from '@/lib/edgeFunctions';
import { supabase } from '@/lib/supabase';
import { inputClass } from '@/lib/ui';

export type QuestionOutcome = { kind: 'updated' | 'saved'; message: string };

type Props = {
  question: AuditQuestion;
  onOutcome: (outcome: QuestionOutcome) => void;
};

export function QuestionPrompt({ question, onOutcome }: Props) {
  const queryClient = useQueryClient();
  const cost = useActionCost('block_rewrite');
  const { canAfford, askRecharge, handleError } = useRecharge();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['audits'] });
    void queryClient.invalidateQueries({ queryKey: ['full-profile'] });
  }

  const send = useMutation({
    mutationFn: () => answerQuestion(question.id, answer.trim()),
    onSuccess: async () => {
      refreshCredits(queryClient);
      await refresh();
      onOutcome({ kind: 'updated', message: 'Propositions mises à jour avec ta réponse.' });
    },
    onError: async (e) => {
      const code = e instanceof FunctionError ? e.code : undefined;
      if (handleError(e, 'block_rewrite')) {
        refreshCredits(queryClient);
      } else if (code && ANSWER_SAVED_CODES.includes(code)) {
        await refresh();
        onOutcome({ kind: 'saved', message: e.message });
      } else {
        setError(e.message);
      }
    },
  });

  const skip = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('audit_questions')
        .update({ status: 'skipped' })
        .eq('id', question.id);
      if (error) throw new Error('Une erreur est survenue. Réessaie dans un instant.');
    },
    onSuccess: refresh,
    onError: (e) => setError(e.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer.trim()) return;
    setError(null);
    if (!canAfford('block_rewrite')) {
      askRecharge('block_rewrite');
      return;
    }
    send.mutate();
  }

  const busy = send.isPending || skip.isPending;

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 sm:p-4">
      <p className="text-sm font-medium text-slate-900">{question.question}</p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={300}
          placeholder="Ta réponse, en une ligne"
          aria-label="Ta réponse"
          disabled={busy}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !answer.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {send.isPending && <Spinner />}
          Envoyer
        </button>
      </form>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-600">
        <span role="status">
          {send.isPending
            ? 'On réécrit les propositions avec ta réponse…'
            : 'Ta réponse rejoint tes preuves et met à jour les propositions.'}
          {!send.isPending && cost !== undefined && (
            <span className="font-medium text-slate-700"> · {formatCost(cost)}</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => skip.mutate()}
          disabled={busy}
          className="shrink-0 rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-sky-100 hover:text-slate-900 disabled:opacity-60"
        >
          Passer
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
