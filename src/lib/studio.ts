import type { Enums, TablesUpdate } from './database.types';
import { invokeFunction } from './edgeFunctions';
import { todayIso, type Format } from './plan';
import { supabase } from './supabase';

export type Tone = Enums<'post_tone'>;
export type PostStatus = Enums<'post_status'>;
export const TONES: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'conversational', label: 'Conversationnel' },
  { value: 'direct', label: 'Direct' },
];
export const MAX_POST = 3000;
export const MAX_INSTRUCTION = 300;
export const MIN_VOICE_SAMPLE = 200;
export const MAX_VOICE_SAMPLE = 12000;

export type SlotInfo = {
  id: string;
  date: string;
  format: Format;
  angle: string;
  pillarName: string | null;
};
export type StudioPost = {
  id: string;
  body: string;
  status: PostStatus;
  tone: Tone | null;
  createdAt: string;
  slot: SlotInfo | null;
};
export type Voice = {
  learned_at?: string;
  source?: 'posts' | 'sample';
  address?: string;
  emojis?: string;
  register?: string;
};
export type StudioData = {
  posts: StudioPost[];
  /** Créneaux à venir encore sans post. */
  upcoming: SlotInfo[];
  /** Tous les créneaux sans post, passés compris (ouverture depuis le plan). */
  openSlots: SlotInfo[];
  voice: Voice;
};

const ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

export async function fetchStudio(userId: string): Promise<StudioData> {
  const [posts, slots, pillars, strategic] = await Promise.all([
    supabase
      .from('posts')
      .select('id, body, status, tone, slot_id, created_at')
      .eq('user_id', userId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('plan_slots')
      .select('id, scheduled_date, format, angle, pillar_id, post_id')
      .eq('user_id', userId)
      .order('scheduled_date'),
    supabase.from('content_pillars').select('id, name').eq('user_id', userId),
    supabase.from('strategic_profiles').select('voice').eq('user_id', userId).maybeSingle(),
  ]);
  for (const r of [posts, slots, pillars, strategic]) if (r.error) throw r.error;

  const pillarName = new Map(pillars.data!.map((p) => [p.id, p.name]));
  const slotInfo = (s: NonNullable<typeof slots.data>[number]): SlotInfo => ({
    id: s.id,
    date: s.scheduled_date,
    format: s.format,
    angle: s.angle ?? '',
    pillarName: s.pillar_id ? (pillarName.get(s.pillar_id) ?? null) : null,
  });
  const slotById = new Map(slots.data!.map((s) => [s.id, slotInfo(s)]));
  const today = todayIso();

  return {
    posts: posts.data!.map((p) => ({
      id: p.id,
      body: p.body ?? '',
      status: p.status,
      tone: p.tone,
      createdAt: p.created_at,
      slot: p.slot_id ? (slotById.get(p.slot_id) ?? null) : null,
    })),
    upcoming: slots
      .data!.filter((s) => !s.post_id && s.scheduled_date >= today)
      .slice(0, 6)
      .map(slotInfo),
    openSlots: slots.data!.filter((s) => !s.post_id).map(slotInfo),
    voice: ((strategic.data?.voice ?? {}) as Voice) ?? {},
  };
}

export async function savePost(id: string, patch: TablesUpdate<'posts'>) {
  const { error } = await supabase.from('posts').update(patch).eq('id', id);
  if (error) throw new Error(ERROR);
}

/** Publié ou brouillon : le créneau du plan suit le statut du post. */
export async function setPostStatus(post: StudioPost, status: 'draft' | 'published') {
  await savePost(post.id, { status });
  if (post.slot) {
    const { error } = await supabase
      .from('plan_slots')
      .update({ status: status === 'published' ? 'published' : 'drafted' })
      .eq('id', post.slot.id);
    if (error) throw new Error(ERROR);
  }
}

export async function deletePost(post: StudioPost) {
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) throw new Error(ERROR);
  if (post.slot) {
    // Le lien post_id est remis à zéro par la base ; le créneau redevient à rédiger.
    await supabase.from('plan_slots').update({ status: 'planned' }).eq('id', post.slot.id);
  }
}

export function writePost(input: {
  slotId?: string;
  subject?: string;
  tone: Tone;
  instruction?: string;
}) {
  return invokeFunction<{ post_id: string; body: string; credits_balance: number }>(
    'write-post',
    {
      slot_id: input.slotId ?? null,
      subject: input.subject ?? null,
      tone: input.tone,
      instruction: input.instruction || null,
    },
    {
      insufficient_credits: 'Ton solde ne couvre pas la rédaction de ce post.',
      subject_missing: 'Choisis un créneau de ton plan ou écris ton sujet.',
      slot_not_found: 'Ce créneau n’existe plus. Recharge la page.',
      profile_missing: 'Commence par présenter ton profil.',
      llm_not_configured: 'La rédaction est momentanément indisponible. Réessaie plus tard.',
      llm_failed: 'La rédaction n’a pas abouti. Aucun crédit n’a été débité : tu peux relancer.',
    },
  );
}

export function refinePost(postId: string, instruction: string) {
  return invokeFunction<{ body: string }>(
    'refine-post',
    { post_id: postId, instruction },
    {
      insufficient_credits: 'Ton solde ne couvre pas cette retouche.',
      instruction_missing: 'Dis en quelques mots ce que tu veux changer.',
      too_long: 'Une ou deux phrases suffisent.',
      post_not_found: 'Ce post n’existe plus. Recharge la page.',
      post_empty: 'Le post est vide : écris-le ou rédige-le d’abord.',
      llm_not_configured: 'La retouche est momentanément indisponible. Réessaie plus tard.',
      llm_failed: 'La retouche n’a pas abouti. Réessaie dans un instant.',
    },
  );
}

export function learnVoice(text: string, source: 'posts' | 'sample') {
  return invokeFunction<{ voice: Voice }>(
    'learn-voice',
    { text, source },
    {
      too_short: `Colle un peu plus de texte : ${MIN_VOICE_SAMPLE} caractères au moins.`,
      too_long: 'C’est trop long : trois à cinq posts suffisent.',
      profile_missing: 'Commence par présenter ton profil.',
      llm_not_configured: 'Service momentanément indisponible. Réessaie plus tard.',
      llm_failed: 'L’analyse n’a pas abouti. Réessaie dans un instant.',
    },
  );
}
