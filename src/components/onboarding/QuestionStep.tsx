import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormError, SubmitButton, TextAreaField } from '@/components/fields';
import { useAuth } from '@/hooks/useAuth';
import { OBJECTIVES, type Objective } from '@/lib/objectives';
import { supabase } from '@/lib/supabase';

type Props = { objective: Objective | null; initial: string | null; onDone: () => void };

export function QuestionStep({ objective, initial, onDone }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState(initial ?? '');
  const [error, setError] = useState<string | null>(null);
  const example = OBJECTIVES.find((o) => o.value === objective)?.example;

  const save = useMutation({
    mutationFn: async (offer: string) => {
      const { error } = await supabase
        .from('strategic_profiles')
        .upsert({ user_id: user?.id as string, offer }, { onConflict: 'user_id' });
      if (error) throw new Error('Une erreur est survenue. Réessaie dans un instant.');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      onDone();
    },
    onError: (e) => setError(e.message),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) {
      setError('Écris une ou deux phrases pour continuer.');
      return;
    }
    setError(null);
    save.mutate(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TextAreaField
        label="En une ou deux phrases, qu’est-ce que tu cherches concrètement ?"
        rows={3}
        maxLength={500}
        placeholder={example}
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          setError(null);
        }}
        disabled={save.isPending}
      />
      <FormError message={error} />
      <SubmitButton pending={save.isPending}>
        {save.isPending ? 'Enregistrement…' : 'Terminer'}
      </SubmitButton>
    </form>
  );
}
