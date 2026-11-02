import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { buildAuditInput } from '../_shared/audit.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import {
  buildSlotsInput,
  buildStrategyInput,
  HORIZONS,
  loadStrategy,
  normalizePlan,
  PLAN_SCHEMA,
  PLAN_SYSTEM_PROMPT,
  RHYTHMS,
  scheduleSlots,
  type Horizon,
  type PlannedSlot,
  type Rhythm,
} from '../_shared/plan.ts';
import { COSTS } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.5';

/**
 * Le nouveau plan est enregistré en entier avant que l'ancien soit retiré :
 * un échec en cours de route ne laisse jamais la personne sans plan.
 */
async function savePlan(
  userId: string,
  horizon: Horizon,
  startDate: string,
  slots: PlannedSlot[],
): Promise<string> {
  const { data: plan, error } = await admin
    .from('content_plans')
    .insert({ user_id: userId, horizon, start_date: startDate })
    .select('id')
    .single();
  if (error) throw error;

  const { error: slotsError } = await admin.from('plan_slots').insert(
    slots.map((s) => ({
      user_id: userId,
      plan_id: plan.id,
      scheduled_date: s.date,
      pillar_id: s.pillar.id,
      format: s.format,
      angle: s.angle,
    })),
  );
  if (slotsError) {
    await admin.from('content_plans').delete().eq('id', plan.id);
    throw slotsError;
  }

  const { error: cleanupError } = await admin
    .from('content_plans')
    .delete()
    .eq('user_id', userId)
    .neq('id', plan.id);
  if (cleanupError) throw cleanupError;
  return plan.id;
}

serve(async (req, { userId }) => {
  const body = await readJson(req);
  const horizon = body.horizon as Horizon;
  const rhythm = body.rhythm as Rhythm;
  if (!HORIZONS.includes(horizon) || !RHYTHMS.includes(rhythm)) {
    throw new HttpError(400, 'bad_request');
  }

  const [{ input }, strategy] = await Promise.all([loadProfileInput(userId), loadStrategy(userId)]);
  if (!strategy.pillars.length) throw new HttpError(409, 'pillars_missing');
  const { startDate, slots } = scheduleSlots(horizon, rhythm, strategy.pillars);
  const client = openaiClient();

  const { result, balance } = await tracked(
    userId,
    'content_plan',
    COSTS.content_plan,
    async () => {
      const { data, usage } = await generateJson(client, {
        model: MODEL,
        effort: 'low',
        system: PLAN_SYSTEM_PROMPT,
        user: `${buildAuditInput(input)}\n\n${buildStrategyInput(strategy)}\n\n${buildSlotsInput(slots)}`,
        schemaName: 'plan_editorial',
        schema: PLAN_SCHEMA,
      });
      const planned = normalizePlan(data, slots);
      const planId = await savePlan(userId, horizon, startDate, planned);
      return { result: { planId, count: planned.length }, usage };
    },
  );

  return { plan_id: result.planId, slots: result.count, credits_balance: balance };
});
