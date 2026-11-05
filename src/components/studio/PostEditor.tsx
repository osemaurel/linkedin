import { useId, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AutosaveField } from '@/components/profile/AutosaveField';
import { Spinner } from '@/components/Spinner';
import { useActionCost } from '@/hooks/usePricing';
import { useRecharge } from '@/hooks/useRecharge';
import { formatCost, refreshCredits } from '@/lib/credits';
import { FORMAT_LABELS, formatShortDay } from '@/lib/plan';
import {
  MAX_INSTRUCTION,
  MAX_POST,
  refinePost,
  savePost,
  setPostStatus,
  TONES,
  type StudioPost,
} from '@/lib/studio';
import { inputClass } from '@/lib/ui';
import { VisualPanel } from './VisualPanel';

type Props = {
  post: StudioPost;
  onChange: (patch: Partial<StudioPost>) => void;
  onDelete: () => void;
};

const action =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60';

export function PostEditor({ post, onChange, onDelete }: Props) {
  const id = useId();
  const queryClient = useQueryClient();
  const [request, setRequest] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cost = useActionCost('post_refine');
  const { canAfford, askRecharge, handleError } = useRecharge();
  const published = post.status === 'published';
  const tone = TONES.find((t) => t.value === post.tone)?.label;

  const refine = useMutation({
    mutationFn: () => refinePost(post.id, request.trim()),
    onSuccess: ({ body }) => {
      onChange({ body });
      setRequest('');
      refreshCredits(queryClient);
    },
    onError: (e) => {
      if (handleError(e, 'post_refine')) refreshCredits(queryClient);
      else setError(e.message);
    },
  });

  const status = useMutation({
    mutationFn: (next: 'draft' | 'published') => setPostStatus(post, next),
    onSuccess: (_, next) => onChange({ status: next }),
    onError: (e) => setError(e.message),
  });

  function submitRefine(event: FormEvent) {
    event.preventDefault();
    if (!request.trim()) return;
    setError(null);
    if (!canAfford('post_refine')) return askRecharge('post_refine');
    refine.mutate();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(post.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('La copie a échoué : sélectionne le texte et copie-le à la main.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span
          className={`rounded-full px-2 py-0.5 ${published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
        >
          {published ? 'Publié' : 'Brouillon'}
        </span>
        {post.slot ? (
          <span className="text-slate-500">
            <span className="inline-block first-letter:uppercase">
              {formatShortDay(post.slot.date)}
            </span>
            {post.slot.pillarName ? ` · ${post.slot.pillarName}` : ''} ·{' '}
            {FORMAT_LABELS[post.slot.format]}
          </span>
        ) : (
          <span className="text-slate-500">Sujet libre</span>
        )}
        {tone && <span className="text-slate-500">· {tone}</span>}
      </div>

      {post.slot && post.slot.format !== 'text' && (
        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          Le format prévu est {post.slot.format === 'image' ? 'une image' : 'un carrousel'} :
          prépare-le dans la partie Visuel, sous le post.
        </p>
      )}

      <div className={refine.isPending ? 'pointer-events-none opacity-60' : ''}>
        <AutosaveField
          label="Ton post"
          value={post.body}
          multiline
          autoGrow
          rows={8}
          maxLength={MAX_POST}
          showCount
          onChange={(body) => onChange({ body })}
          onSave={(body) => savePost(post.id, { body })}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => void copy()} className={action}>
          {copied ? '✓ Copié' : 'Copier le texte'}
        </button>
        <button
          type="button"
          onClick={() => status.mutate(published ? 'draft' : 'published')}
          disabled={status.isPending}
          className={action}
        >
          {published ? 'Remettre en brouillon' : 'Marquer comme publié'}
        </button>
        <button
          type="button"
          onClick={() => window.confirm('Supprimer ce post ?') && onDelete()}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 sm:ml-auto"
        >
          Supprimer
        </button>
      </div>

      <form
        onSubmit={submitRefine}
        className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4"
      >
        <label htmlFor={`${id}-refine`} className="block text-sm font-medium text-slate-900">
          Affiner
        </label>
        <p className="mt-0.5 text-xs text-slate-600">
          Dis en français ce que tu veux changer, le post est réécrit.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={`${id}-refine`}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            maxLength={MAX_INSTRUCTION}
            placeholder="Ex. : trop corporate, rends ça plus direct"
            disabled={refine.isPending}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={refine.isPending || !request.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refine.isPending && <Spinner />}
            {refine.isPending ? 'Réécriture…' : 'Affiner'}
          </button>
        </div>
        {cost !== undefined && (
          <p className="mt-1.5 text-xs text-slate-500">Coût : {formatCost(cost)}</p>
        )}
      </form>

      <VisualPanel postId={post.id} plannedFormat={post.slot?.format ?? null} />

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
