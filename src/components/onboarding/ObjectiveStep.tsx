import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormError } from '@/components/fields';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { OBJECTIVES, type Objective } from '@/lib/objectives';
import { supabase } from '@/lib/supabase';

type Props = { value: Objective | null; onDone: () => void };

export function ObjectiveStep({ value, onDone }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (objective: Objective) => {
      const { error } = await supabase
        .from('profiles')
        .update({ objective })
        .eq('id', user?.id as string);
      if (error) throw new Error('Une erreur est survenue. Réessaie dans un instant.');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      onDone();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Choisis ce qui compte le plus pour toi en ce moment.</p>
      <div className="grid gap-3">
        {OBJECTIVES.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              disabled={save.isPending}
              onClick={() => {
                setError(null);
                save.mutate(o.value);
              }}
              className={[
                'flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed',
                selected
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <span>
                <span className="block font-medium text-slate-900">{o.label}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{o.description}</span>
              </span>
              {save.isPending && save.variables === o.value ? (
                <Spinner className="h-4 w-4 text-sky-600" />
              ) : (
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-slate-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.2 4.2a1 1 0 0 1 1.4 0l5.1 5.1a1 1 0 0 1 0 1.4l-5.1 5.1a1 1 0 0 1-1.4-1.4L11.6 10 7.2 5.6a1 1 0 0 1 0-1.4Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <FormError message={error} />
    </div>
  );
}
