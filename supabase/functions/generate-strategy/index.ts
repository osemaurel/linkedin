import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { buildAuditInput } from '../_shared/audit.ts';
import { admin, serve } from '../_shared/http.ts';
import { COSTS } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';
import {
  normalizeStrategy,
  STRATEGY_SCHEMA,
  STRATEGY_SYSTEM_PROMPT,
  type Strategy,
} from '../_shared/strategy.ts';

const MODEL = 'gpt-5.5';

/**
 * Enregistre la proposition : positionnement, audience si la personne n'en a pas encore
 * écrit, et piliers. Les nouveaux piliers sont insérés avant de retirer les anciens :
 * un échec en cours de route ne laisse jamais la personne sans piliers.
 */
async function saveStrategy(userId: string, strategy: Strategy, keepAudience: boolean) {
  const { data: previous, error: prevError } = await admin
    .from('content_pillars')
    .select('id')
    .eq('user_id', userId);
  if (prevError) throw prevError;

  const { error: insertError } = await admin.from('content_pillars').insert(
    strategy.pillars.map((p, position) => ({
      user_id: userId,
      name: p.name,
      description: p.description,
      position,
    })),
  );
  if (insertError) throw insertError;

  if (previous.length) {
    const { error } = await admin
      .from('content_pillars')
      .delete()
      .in(
        'id',
        previous.map((p) => p.id),
      );
    if (error) throw error;
  }

  const { error } = await admin
    .from('strategic_profiles')
    .update({
      positioning: strategy.positioning,
      ...(keepAudience ? {} : { target_audience: strategy.audience }),
    })
    .eq('user_id', userId);
  if (error) throw error;
}

serve(async (_req, { userId }) => {
  const { input } = await loadProfileInput(userId);
  const client = openaiClient();
  const keepAudience = Boolean(input.targetAudience?.trim());

  const { result, balance } = await tracked(userId, 'pillars', COSTS.pillars, async () => {
    const { data, usage } = await generateJson(client, {
      model: MODEL,
      effort: 'low',
      system: STRATEGY_SYSTEM_PROMPT,
      user: buildAuditInput(input),
      schemaName: 'strategie_contenu',
      schema: STRATEGY_SCHEMA,
    });
    const strategy = normalizeStrategy(data);
    await saveStrategy(userId, strategy, keepAudience);
    return { result: strategy, usage };
  });

  return { pillars: result.pillars.length, credits_balance: balance };
});
