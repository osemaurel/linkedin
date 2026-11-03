import { useId, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
import { useActionCost } from '@/hooks/usePricing';
import { formatCost } from '@/lib/credits';
import { learnVoice, MAX_VOICE_SAMPLE, MIN_VOICE_SAMPLE, type Voice } from '@/lib/studio';
import { inputClass } from '@/lib/ui';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

/**
 * Règle de non-blocage du cadrage : on rédige sans voix apprise, avec une invitation
 * discrète à montrer d'anciens posts. Le gain est visible, donc la personne le fera.
 */
export function VoicePanel({ voice, onLearned }: { voice: Voice; onLearned: () => void }) {
  const id = useId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<'posts' | 'sample'>('posts');
  const [text, setText] = useState('');
  const cost = useActionCost('voice_profile');
  const learned = Boolean(voice.learned_at);

  const learn = useMutation({
    mutationFn: () => learnVoice(text.trim(), source),
    onSuccess: () => {
      setOpen(false);
      setText('');
      void queryClient.invalidateQueries({ queryKey: ['credit-history'] });
      onLearned();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (text.trim().length < MIN_VOICE_SAMPLE) return;
    learn.mutate();
  }

  if (!open) {
    return (
      <p className="text-sm text-slate-600">
        {learned ? (
          <>
            Ta voix est apprise
            {voice.learned_at ? ` depuis le ${dateFormat.format(new Date(voice.learned_at))}` : ''}
            {voice.source === 'posts' ? ', à partir de tes anciens posts' : ''}.{' '}
          </>
        ) : (
          <>Ce post sonnerait plus comme toi si tu nous montrais trois de tes anciens posts. </>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-medium text-sky-700 underline hover:text-sky-800"
        >
          {learned ? 'Mettre à jour ma voix' : 'Montrer mes posts'}
        </button>
      </p>
    );
  }

  const enough = text.trim().length >= MIN_VOICE_SAMPLE;

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <div>
        <label htmlFor={`${id}-text`} className="block text-sm font-medium text-slate-900">
          {source === 'posts'
            ? 'Colle trois à cinq de tes anciens posts'
            : 'Raconte en quelques lignes ce que tu fais et pourquoi'}
        </label>
        <p className="mt-0.5 text-xs text-slate-600">
          On en tire ta façon d’écrire (rythme, accroches, émojis, expressions), jamais leur
          contenu. Les textes ne sont pas conservés.
        </p>
      </div>
      <textarea
        id={`${id}-text`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        maxLength={MAX_VOICE_SAMPLE}
        disabled={learn.isPending}
        className={`${inputClass} resize-y`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {text.trim().length < MIN_VOICE_SAMPLE
            ? `Encore ${MIN_VOICE_SAMPLE - text.trim().length} caractères au moins`
            : 'C’est suffisant'}
        </span>
        <button
          type="button"
          onClick={() => setSource((s) => (s === 'posts' ? 'sample' : 'posts'))}
          className="font-medium text-sky-700 hover:underline"
        >
          {source === 'posts' ? 'Je n’ai jamais posté' : 'J’ai d’anciens posts'}
        </button>
      </div>
      {learn.isError && (
        <p role="alert" className="text-sm text-red-700">
          {learn.error.message}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={!enough || learn.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {learn.isPending && <Spinner />}
          {learn.isPending ? 'Analyse…' : 'Apprendre ma voix'}
        </button>
        {cost !== undefined && (
          <span className="text-xs text-slate-500">Coût : {formatCost(cost)}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:ml-auto"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
