import { useQuery } from '@tanstack/react-query';
import {
  parseAudit,
  type Audit,
  type AuditQuestion,
  type Block,
  type Suggestion,
} from '@/lib/audit';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type AuditsState = {
  latest: Audit | null;
  previous: Audit | null;
  suggestions: Suggestion[];
  /** La seule question affichée : la première encore sans réponse. */
  question: AuditQuestion | null;
};

export function useAudits() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['audits', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<AuditsState> => {
      const { data: rows, error } = await supabase
        .from('audits')
        .select('id, created_at, score_global, scores, quick_wins')
        .eq('user_id', userId as string)
        .order('created_at', { ascending: false })
        .limit(2);
      if (error) throw error;
      if (!rows.length) return { latest: null, previous: null, suggestions: [], question: null };

      const latest = parseAudit(rows[0]);
      const [suggestions, questions] = await Promise.all([
        supabase
          .from('audit_suggestions')
          .select('id, block, content')
          .eq('audit_id', latest.id)
          .order('variant_index'),
        supabase
          .from('audit_questions')
          .select('id, block, question')
          .eq('audit_id', latest.id)
          .eq('status', 'pending')
          .order('position')
          .limit(1),
      ]);
      if (suggestions.error) throw suggestions.error;
      if (questions.error) throw questions.error;

      const next = questions.data[0];
      return {
        latest,
        previous: rows[1] ? parseAudit(rows[1]) : null,
        suggestions: suggestions.data.map((s) => ({ ...s, block: s.block as Block })),
        question: next ? { ...next, block: next.block as Block } : null,
      };
    },
  });
}
