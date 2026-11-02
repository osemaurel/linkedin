import { useQuery } from '@tanstack/react-query';
import { invokeFunction } from '@/lib/edgeFunctions';

export type PricedAction = 'audit' | 'block_rewrite' | 'profile_parse';
export type Pack = { id: string; name: string; credits: number; price: number; currency: string };
export type PricedActionInfo = { kind: PricedAction; label: string; cost: number };
export type Pricing = { actions: PricedActionInfo[]; packs: Pack[] };

/** Coûts et packs, définis côté Edge Function : l'application ne fait que les lire. */
export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: () => invokeFunction<Pricing>('pricing', {}, {}),
    staleTime: 10 * 60 * 1000,
  });
}

export function actionOf(
  pricing: Pricing | undefined,
  kind: PricedAction,
): PricedActionInfo | undefined {
  return pricing?.actions.find((a) => a.kind === kind);
}

/** Coût lu depuis le serveur ; `undefined` tant qu'il n'est pas chargé. */
export function useActionCost(kind: PricedAction): number | undefined {
  const { data } = usePricing();
  return actionOf(data, kind)?.cost;
}
