import { admin } from './http.ts';

/**
 * Coûts et packs. Ils vivent en base (tables action_costs et credit_packs) et se modifient
 * depuis le centre de contrôle : chaque Edge Function relit le coût au moment de débiter,
 * l'application les lit via la fonction `pricing`. Rien n'est écrit en dur côté client.
 */

/** Barème de départ : il ne sert que si une action n'a pas encore de ligne en base. */
export const DEFAULT_COSTS = {
  audit: 5,
  block_rewrite: 0,
  profile_parse: 0,
  pillars: 2,
  content_plan: 3,
  plan_slot: 0,
  post: 1,
  post_refine: 0,
  voice_profile: 0,
  targeting: 1,
  outreach_message: 1,
  carousel: 0,
  image: 5,
} as const;

export type PricedAction = keyof typeof DEFAULT_COSTS;

export const PRICED_ACTIONS = Object.keys(DEFAULT_COSTS) as PricedAction[];

export const ACTION_LABELS: Record<PricedAction, string> = {
  audit: 'Audit complet du profil',
  block_rewrite: 'Réponse à une question de l’audit',
  profile_parse: 'Lecture de ton profil LinkedIn',
  pillars: 'Proposition de stratégie de contenu',
  content_plan: 'Plan éditorial',
  plan_slot: 'Nouvel angle pour un créneau',
  post: 'Rédaction d’un post',
  post_refine: 'Retouche d’un post',
  voice_profile: 'Apprentissage de ta voix',
  targeting: 'Ciblage et recherches LinkedIn',
  outreach_message: 'Messages d’approche',
  carousel: 'Carrousel',
  image: 'Image d’illustration',
};

export type Pack = {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  active: boolean;
};

/** Coût actuel d'une action, lu au moment de débiter. */
export async function getCost(kind: PricedAction): Promise<number> {
  const { data, error } = await admin
    .from('action_costs')
    .select('cost')
    .eq('kind', kind)
    .maybeSingle();
  if (error) throw error;
  return data?.cost ?? DEFAULT_COSTS[kind];
}

/** Toutes les actions payantes, dans l'ordre du barème, avec leur coût actuel. */
export async function loadActions() {
  const { data, error } = await admin.from('action_costs').select('kind, cost, updated_at');
  if (error) throw error;
  const rows = new Map(data.map((r) => [r.kind as string, r]));
  return PRICED_ACTIONS.map((kind) => ({
    kind,
    label: ACTION_LABELS[kind],
    cost: rows.get(kind)?.cost ?? DEFAULT_COSTS[kind],
    default_cost: DEFAULT_COSTS[kind] as number,
    updated_at: rows.get(kind)?.updated_at ?? null,
  }));
}

/** Packs du moins cher au plus cher ; les packs désactivés seulement pour l'administration. */
export async function loadPacks({ includeInactive = false } = {}): Promise<Pack[]> {
  let query = admin
    .from('credit_packs')
    .select('id, name, credits, price, currency, active')
    .order('price')
    .order('credits');
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Pack achetable : il doit exister et être actif. */
export async function findActivePack(id: unknown): Promise<Pack | null> {
  if (typeof id !== 'string' || !id) return null;
  const { data, error } = await admin
    .from('credit_packs')
    .select('id, name, credits, price, currency, active')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
