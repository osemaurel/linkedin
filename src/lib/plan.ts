import type { Enums, TablesUpdate } from './database.types';
import { invokeFunction } from './edgeFunctions';
import { supabase } from './supabase';

export type Format = Enums<'post_format'>;
export const FORMATS: { value: Format; label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'carousel', label: 'Carrousel' },
  { value: 'image', label: 'Image' },
];
export const FORMAT_LABELS = Object.fromEntries(FORMATS.map((f) => [f.value, f.label])) as Record<
  Format,
  string
>;

export const HORIZONS = [30, 60, 90] as const;
export const RHYTHMS = [2, 3] as const;
export type Horizon = (typeof HORIZONS)[number];
export type Rhythm = (typeof RHYTHMS)[number];

export type PlanSlot = {
  id: string;
  date: string; // AAAA-MM-JJ
  pillarId: string | null;
  format: Format;
  angle: string;
  /** Post rédigé dans le Studio pour ce créneau. */
  postId: string | null;
};
export type PlanPillar = { id: string; name: string };
export type PlanData = {
  plan: { id: string; horizon: number; startDate: string } | null;
  slots: PlanSlot[];
  pillars: PlanPillar[];
};

const ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

/** Le plan en cours (le plus récent), ses créneaux et les piliers disponibles. */
export async function fetchPlan(userId: string): Promise<PlanData> {
  const [plans, pillars] = await Promise.all([
    supabase
      .from('content_plans')
      .select('id, horizon, start_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('content_pillars')
      .select('id, name')
      .eq('user_id', userId)
      .order('position')
      .order('created_at'),
  ]);
  if (plans.error) throw plans.error;
  if (pillars.error) throw pillars.error;

  const plan = plans.data[0];
  let slots: PlanSlot[] = [];
  if (plan) {
    const { data, error } = await supabase
      .from('plan_slots')
      .select('id, scheduled_date, pillar_id, format, angle, post_id')
      .eq('plan_id', plan.id)
      .order('scheduled_date')
      .order('created_at');
    if (error) throw error;
    slots = data.map((s) => ({
      id: s.id,
      date: s.scheduled_date,
      pillarId: s.pillar_id,
      format: s.format,
      angle: s.angle ?? '',
      postId: s.post_id,
    }));
  }
  return {
    plan: plan ? { id: plan.id, horizon: plan.horizon, startDate: plan.start_date } : null,
    slots,
    pillars: pillars.data,
  };
}

export async function saveSlot(id: string, patch: TablesUpdate<'plan_slots'>) {
  const { error } = await supabase.from('plan_slots').update(patch).eq('id', id);
  if (error) throw new Error(ERROR);
}

export function generatePlan(horizon: Horizon, rhythm: Rhythm) {
  return invokeFunction<{ plan_id: string; slots: number; credits_balance: number }>(
    'generate-plan',
    { horizon, rhythm },
    {
      insufficient_credits: 'Ton solde ne couvre pas ce plan.',
      pillars_missing: 'Définis d’abord tes piliers de contenu dans ta stratégie.',
      profile_missing: 'Commence par présenter ton profil.',
      llm_not_configured: 'Le plan est momentanément indisponible. Réessaie un peu plus tard.',
      llm_failed: 'Le plan n’a pas abouti. Aucun crédit n’a été débité : tu peux relancer.',
    },
  );
}

export function regenerateSlot(slotId: string) {
  return invokeFunction<{ format: Format; angle: string }>(
    'regenerate-slot',
    { slot_id: slotId },
    {
      insufficient_credits: 'Ton solde ne couvre pas un nouvel angle.',
      slot_not_found: 'Ce créneau n’existe plus. Recharge la page.',
      llm_not_configured: 'Service momentanément indisponible. Réessaie un peu plus tard.',
      llm_failed: 'Le nouvel angle n’a pas abouti. Réessaie dans un instant.',
    },
  );
}

// ---------------------------------------------------------------------------
// Dates : les créneaux sont des jours calendaires (AAAA-MM-JJ), sans fuseau.
// ---------------------------------------------------------------------------

export const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const toIso = (d: Date) => d.toISOString().slice(0, 10);

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' });
const shortDay = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const longDay = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const dayMonth = fmt({ day: 'numeric', month: 'short' });
const monthYear = fmt({ month: 'long', year: 'numeric' });

export const formatShortDay = (iso: string) => shortDay.format(toDate(iso));
export const formatLongDay = (iso: string) => longDay.format(toDate(iso));
export const formatDayMonth = (iso: string) => dayMonth.format(toDate(iso));
export const formatMonth = (d: Date) => monthYear.format(d);

/** Lundi de la semaine du jour donné. */
export function mondayOf(iso: string): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return toIso(d);
}

export function todayIso(): string {
  const now = new Date();
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** Couleur stable par pilier, d'après son rang. */
const PILLAR_COLORS = [
  { chip: 'bg-brand-100 text-brand-800', dot: 'bg-brand-500' },
  { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  { chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  { chip: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
];
const NO_PILLAR = { chip: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' };

export function pillarColor(pillars: PlanPillar[], pillarId: string | null) {
  const index = pillars.findIndex((p) => p.id === pillarId);
  return index < 0 ? NO_PILLAR : PILLAR_COLORS[index % PILLAR_COLORS.length];
}
