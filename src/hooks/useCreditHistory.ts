import { useQuery } from '@tanstack/react-query';
import type { Enums } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type CreditMovement = {
  id: string;
  createdAt: string;
  delta: number;
  balanceAfter: number;
  reason: Enums<'credit_reason'>;
  /** Pour un débit : le type de génération qui l'a causé. */
  kind: Enums<'generation_kind'> | null;
};

export function useCreditHistory() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['credit-history', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<CreditMovement[]> => {
      const { data: rows, error } = await supabase
        .from('credit_transactions')
        .select('id, created_at, delta, balance_after, reason, ref_id')
        .eq('user_id', userId as string)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const generationIds = rows
        .filter((r) => r.reason === 'generation_debit' && r.ref_id)
        .map((r) => r.ref_id as string);
      const kinds = new Map<string, Enums<'generation_kind'>>();
      if (generationIds.length) {
        const { data: generations, error: genError } = await supabase
          .from('generations')
          .select('id, kind')
          .in('id', generationIds);
        if (genError) throw genError;
        for (const g of generations) kinds.set(g.id, g.kind);
      }

      return rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        delta: r.delta,
        balanceAfter: r.balance_after,
        reason: r.reason,
        kind: r.ref_id ? (kinds.get(r.ref_id) ?? null) : null,
      }));
    },
  });
}
