import { useQuery } from '@tanstack/react-query';
import { invokeFunction } from '@/lib/edgeFunctions';

export type PricedAction =
  | 'audit'
  | 'block_rewrite'
  | 'profile_parse'
  | 'pillars'
  | 'content_plan'
  | 'plan_slot'
  | 'post'
  | 'post_refine'
  | 'voice_profile'
  | 'targeting'
  | 'outreach_message'
  | 'carousel'
  | 'image';
export type Pack = { id: string; name: string; credits: number; price: number; currency: string };
export type PricedActionInfo = { kind: PricedAction; label: string; cost: number };
export type Pricing = { actions: PricedActionInfo[]; packs: Pack[] };

/**
 * Coûts et packs, fixés au centre de contrôle et servis par l'Edge Function `pricing` :
 * l'application ne fait que les lire. Relus chaque minute au plus, et après chaque action
 * payante, pour qu'un tarif modifié s'affiche vite.
 */
export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: () => invokeFunction<Pricing>('pricing', {}, {}),
    staleTime: 60 * 1000,
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
