import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { buildAuditInput } from '../_shared/audit.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import {
  buildVoiceInput,
  loadVoice,
  MAX_INSTRUCTION,
  MAX_POST,
  normalizePost,
  POST_SCHEMA,
  REFINE_SYSTEM_PROMPT,
} from '../_shared/post.ts';
import { COSTS } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.5';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** « Affiner » : l'auteur dit en français ce qu'il veut changer, le post est réécrit. */
serve(async (req, { userId }) => {
  const body = await readJson(req);
  const instruction = typeof body.instruction === 'string' ? body.instruction.trim() : '';
  if (typeof body.post_id !== 'string' || !UUID.test(body.post_id)) {
    throw new HttpError(400, 'bad_request');
  }
  if (!instruction) throw new HttpError(400, 'instruction_missing');
  if (instruction.length > MAX_INSTRUCTION) throw new HttpError(400, 'too_long');

  const { data: post, error } = await admin
    .from('posts')
    .select('id, body')
    .eq('id', body.post_id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!post) throw new HttpError(404, 'post_not_found');
  if (!post.body?.trim()) throw new HttpError(409, 'post_empty');

  const [{ input }, voice] = await Promise.all([loadProfileInput(userId), loadVoice(userId)]);
  const client = openaiClient();

  const { result } = await tracked(userId, 'post_refine', COSTS.post_refine, async () => {
    const { data, usage } = await generateJson(client, {
      model: MODEL,
      effort: 'low',
      system: REFINE_SYSTEM_PROMPT,
      user: `${buildAuditInput(input)}

${buildVoiceInput(voice)}

<post_actuel>
${post.body.slice(0, MAX_POST)}
</post_actuel>

<demande>
${instruction}
</demande>`,
      schemaName: 'post_linkedin',
      schema: POST_SCHEMA,
    });
    const text = normalizePost(data);
    const { error: updateError } = await admin
      .from('posts')
      .update({ body: text })
      .eq('id', post.id)
      .eq('user_id', userId);
    if (updateError) throw updateError;
    return { result: text, usage };
  });

  return { body: result };
});
