import type { TablesUpdate } from './database.types';
import { invokeFunction } from './edgeFunctions';
import { supabase } from './supabase';

export const MIN_PILLARS = 3;
export const MAX_PILLARS = 5;

export type StrategyPillar = { id: string; name: string; description: string };
export type Strategy = { positioning: string; audience: string; pillars: StrategyPillar[] };

const ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

async function check(request: PromiseLike<{ error: unknown }>) {
  const { error } = await request;
  if (error) throw new Error(ERROR);
}

export async function fetchStrategy(userId: string): Promise<Strategy> {
  const [strategic, pillars] = await Promise.all([
    supabase
      .from('strategic_profiles')
      .select('positioning, target_audience')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('content_pillars')
      .select('id, name, description')
      .eq('user_id', userId)
      .order('position')
      .order('created_at'),
  ]);
  if (strategic.error) throw strategic.error;
  if (pillars.error) throw pillars.error;
  return {
    positioning: strategic.data?.positioning ?? '',
    audience: strategic.data?.target_audience ?? '',
    pillars: pillars.data.map((p) => ({ ...p, description: p.description ?? '' })),
  };
}

export const savePillar = (id: string, patch: TablesUpdate<'content_pillars'>) =>
  check(supabase.from('content_pillars').update(patch).eq('id', id));

export async function addPillar(userId: string, position: number): Promise<StrategyPillar> {
  const { data, error } = await supabase
    .from('content_pillars')
    .insert({ user_id: userId, name: '', position })
    .select('id, name, description')
    .single();
  if (error) throw new Error(ERROR);
  return { ...data, description: data.description ?? '' };
}

export const deletePillar = (id: string) =>
  check(supabase.from('content_pillars').delete().eq('id', id));

/** Enregistre l'ordre affiché : la position de chaque pilier devient son rang. */
export async function savePillarOrder(pillars: StrategyPillar[]) {
  await Promise.all(pillars.map((p, position) => savePillar(p.id, { position })));
}

const MESSAGES: Record<string, string> = {
  insufficient_credits: 'Ton solde ne couvre pas cette proposition.',
  profile_missing: 'Commence par présenter ton profil pour obtenir ta stratégie.',
  llm_not_configured: 'La proposition est momentanément indisponible. Réessaie un peu plus tard.',
  llm_failed: 'La proposition n’a pas abouti. Aucun crédit n’a été débité : tu peux relancer.',
};

/** Positionnement, audience (si vide) et piliers, enregistrés par l'Edge Function. */
export function generateStrategy() {
  return invokeFunction<{ pillars: number; credits_balance: number }>(
    'generate-strategy',
    {},
    MESSAGES,
  );
}
