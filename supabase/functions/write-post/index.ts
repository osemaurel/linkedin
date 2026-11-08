import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { buildAuditInput } from '../_shared/audit.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import { buildStrategyInput, frenchDay, loadStrategy } from '../_shared/plan.ts';
import {
  buildVoiceInput,
  loadVoice,
  MAX_INSTRUCTION,
  normalizePost,
  POST_SCHEMA,
  POST_SYSTEM_PROMPT,
  toneLabel,
  TONES,
  type Tone,
} from '../_shared/post.ts';
import { getCost } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.5';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SUBJECT = 300;

const optionalText = (value: unknown, max: number): string => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > max) throw new HttpError(400, 'bad_request');
  return value.trim();
};

/** Rédige un post pour un créneau du plan ou un sujet libre, et l'enregistre en brouillon. */
serve(async (req, { userId }) => {
  const body = await readJson(req);
  const tone = body.tone as Tone;
  if (!TONES.includes(tone)) throw new HttpError(400, 'bad_request');
  const subject = optionalText(body.subject, MAX_SUBJECT);
  const instruction = optionalText(body.instruction, MAX_INSTRUCTION);
  const slotId = body.slot_id === undefined || body.slot_id === null ? null : body.slot_id;
  if (slotId !== null && (typeof slotId !== 'string' || !UUID.test(slotId))) {
    throw new HttpError(400, 'bad_request');
  }
  if (!slotId && !subject) throw new HttpError(400, 'subject_missing');

  let slot: {
    id: string;
    scheduled_date: string;
    format: string;
    angle: string | null;
    pillar_id: string | null;
  } | null = null;
  if (slotId) {
    const { data, error } = await admin
      .from('plan_slots')
      .select('id, scheduled_date, format, angle, pillar_id')
      .eq('id', slotId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'slot_not_found');
    slot = data;
  }

  const [{ input }, strategy, voice] = await Promise.all([
    loadProfileInput(userId),
    loadStrategy(userId),
    loadVoice(userId),
  ]);
  const pillar = strategy.pillars.find((p) => p.id === slot?.pillar_id);

  const publication = slot
    ? `Date prévue : ${frenchDay(slot.scheduled_date)}
Pilier : ${pillar ? `${pillar.name}${pillar.description ? ` : ${pillar.description}` : ''}` : '(aucun)'}
Format prévu : ${slot.format}
Angle : ${slot.angle?.trim() || '(libre, dans le pilier)'}`
    : `Sujet libre : ${subject}`;

  const client = openaiClient();
  const { result, balance } = await tracked(userId, 'post', await getCost('post'), async () => {
    const { data, usage } = await generateJson(client, {
      model: MODEL,
      effort: 'low',
      system: POST_SYSTEM_PROMPT,
      user: `${buildAuditInput(input)}

${buildStrategyInput(strategy)}

${buildVoiceInput(voice)}

<publication>
${publication}
Ton demandé : ${toneLabel(tone)}
Consigne pour ce post : ${instruction || '(aucune)'}
</publication>`,
      schemaName: 'post_linkedin',
      schema: POST_SCHEMA,
    });
    const text = normalizePost(data);

    const { data: post, error } = await admin
      .from('posts')
      .insert({
        user_id: userId,
        slot_id: slot?.id ?? null,
        pillar_id: slot?.pillar_id ?? null,
        body: text,
        tone,
        status: 'draft',
      })
      .select('id')
      .single();
    if (error) throw error;
    if (slot) {
      const { error: slotError } = await admin
        .from('plan_slots')
        .update({ post_id: post.id, status: 'drafted' })
        .eq('id', slot.id);
      if (slotError) throw slotError;
    }
    return { result: { postId: post.id, body: text }, usage };
  });

  return { post_id: result.postId, body: result.body, credits_balance: balance };
});
