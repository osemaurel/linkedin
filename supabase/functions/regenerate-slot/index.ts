import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { buildAuditInput } from '../_shared/audit.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import {
  buildStrategyInput,
  frenchDay,
  loadStrategy,
  normalizeSlot,
  SLOT_SCHEMA,
  SLOT_SYSTEM_PROMPT,
} from '../_shared/plan.ts';
import { getCost } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.4-mini';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req, { userId }) => {
  const body = await readJson(req);
  if (typeof body.slot_id !== 'string' || !UUID.test(body.slot_id)) {
    throw new HttpError(400, 'bad_request');
  }

  const { data: slot, error } = await admin
    .from('plan_slots')
    .select('id, plan_id, scheduled_date, format, angle, pillar_id')
    .eq('id', body.slot_id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!slot) throw new HttpError(404, 'slot_not_found');

  const [{ input }, strategy, others] = await Promise.all([
    loadProfileInput(userId),
    loadStrategy(userId),
    admin.from('plan_slots').select('angle').eq('plan_id', slot.plan_id).neq('id', slot.id),
  ]);
  if (others.error) throw others.error;
  const pillar = strategy.pillars.find((p) => p.id === slot.pillar_id);
  const client = openaiClient();

  const { result } = await tracked(userId, 'plan_slot', await getCost('plan_slot'), async () => {
    const { data, usage } = await generateJson(client, {
      model: MODEL,
      effort: 'low',
      system: SLOT_SYSTEM_PROMPT,
      user: `${buildAuditInput(input)}

${buildStrategyInput(strategy)}

<creneau>
Date : ${frenchDay(slot.scheduled_date)}
Pilier : ${pillar ? `${pillar.name}${pillar.description ? ` : ${pillar.description}` : ''}` : '(aucun : choisis le pilier le plus utile)'}
Format actuel : ${slot.format}
Angle actuel : ${slot.angle ?? '(vide)'}
</creneau>

<autres_angles>
${
  others.data
    .map((o) => o.angle)
    .filter(Boolean)
    .map((a) => `- ${a}`)
    .join('\n') || '(aucun)'
}
</autres_angles>`,
      schemaName: 'nouvel_angle',
      schema: SLOT_SCHEMA,
    });
    const next = normalizeSlot(data);
    const { error: updateError } = await admin
      .from('plan_slots')
      .update(next)
      .eq('id', slot.id)
      .eq('user_id', userId);
    if (updateError) throw updateError;
    return { result: next, usage };
  });

  return result;
});
