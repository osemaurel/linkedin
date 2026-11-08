import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import {
  loadVoice,
  MAX_SAMPLE,
  MIN_SAMPLE,
  normalizeVoice,
  VOICE_SCHEMA,
  VOICE_SYSTEM_PROMPT,
} from '../_shared/post.ts';
import { getCost } from '../_shared/pricing.ts';

const MODEL = 'gpt-5.5';

/**
 * Extrait une fiche de voix d'anciens posts ou d'un échantillon d'écriture. Seule la fiche
 * est gardée, jamais les textes : elle sert ensuite à chaque rédaction.
 */
serve(async (req, { userId }) => {
  const body = await readJson(req);
  const source = body.source === 'sample' ? 'sample' : 'posts';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length < MIN_SAMPLE) throw new HttpError(400, 'too_short');
  if (text.length > MAX_SAMPLE) throw new HttpError(413, 'too_long');

  const { data: strategic, error } = await admin
    .from('strategic_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!strategic) throw new HttpError(409, 'profile_missing');

  const previous = await loadVoice(userId);
  const client = openaiClient();

  const { result } = await tracked(
    userId,
    'voice_profile',
    await getCost('voice_profile'),
    async () => {
      const { data, usage } = await generateJson(client, {
        model: MODEL,
        effort: 'low',
        system: VOICE_SYSTEM_PROMPT,
        user: `<textes source="${source === 'posts' ? 'anciens posts LinkedIn' : 'échantillon libre'}">\n${text}\n</textes>`,
        schemaName: 'fiche_de_voix',
        schema: VOICE_SCHEMA,
      });
      // Les réglages permanents (consignes, interdits) sont conservés.
      const voice = {
        ...normalizeVoice(data, source),
        ...(previous.instructions ? { instructions: previous.instructions } : {}),
        ...(previous.bans ? { bans: previous.bans } : {}),
      };
      const { error: updateError } = await admin
        .from('strategic_profiles')
        .update({ voice })
        .eq('user_id', userId);
      if (updateError) throw updateError;
      return { result: voice, usage };
    },
  );

  return { voice: result };
});
