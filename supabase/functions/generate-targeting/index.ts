import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { buildAuditInput } from '../_shared/audit.ts';
import { admin, serve } from '../_shared/http.ts';
import {
  normalizeTargeting,
  TARGETING_SCHEMA,
  TARGETING_SYSTEM_PROMPT,
} from '../_shared/network.ts';
import { buildStrategyInput, loadStrategy } from '../_shared/plan.ts';
import { COSTS } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.5';

/** Cible déduite du Profil Stratégique, et recherches LinkedIn prêtes à coller. */
serve(async (_req, { userId }) => {
  const [{ input }, strategy] = await Promise.all([loadProfileInput(userId), loadStrategy(userId)]);
  const client = openaiClient();

  const { result, balance } = await tracked(userId, 'targeting', COSTS.targeting, async () => {
    const { data, usage } = await generateJson(client, {
      model: MODEL,
      effort: 'low',
      system: TARGETING_SYSTEM_PROMPT,
      user: `${buildAuditInput(input)}\n\n${buildStrategyInput(strategy)}`,
      schemaName: 'ciblage_linkedin',
      schema: TARGETING_SCHEMA,
    });
    const targeting = normalizeTargeting(data);
    const { queries, ...lists } = targeting;
    const { error } = await admin.from('targets').upsert(
      {
        user_id: userId,
        ...lists,
        saved_queries: queries,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) throw error;
    return { result: targeting, usage };
  });

  return { queries: result.queries.length, credits_balance: balance };
});
