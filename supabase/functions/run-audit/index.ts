import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import {
  AUDIT_SCHEMA,
  AUDIT_SYSTEM_PROMPT,
  buildAuditInput,
  normalizeAudit,
  type AuditResult,
} from '../_shared/audit.ts';
import { admin, HttpError, serve } from '../_shared/http.ts';
import { COSTS } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.5';

async function ensureNoAuditRunning(userId: string) {
  const since = new Date(Date.now() - 3 * 60_000).toISOString();
  const { count, error } = await admin
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', 'audit')
    .eq('status', 'pending')
    .gte('created_at', since);
  if (error) throw error;
  if (count) throw new HttpError(409, 'audit_running');
}

async function saveAudit(userId: string, audit: AuditResult): Promise<string> {
  const scores = Object.fromEntries(
    audit.blocks.map((b) => [
      b.block,
      { score: b.score, impact: b.impact, diagnostic: b.diagnostic },
    ]),
  );
  const { data, error } = await admin
    .from('audits')
    .insert({
      user_id: userId,
      score_global: audit.score_global,
      scores,
      quick_wins: audit.quick_wins,
    })
    .select('id')
    .single();
  if (error) throw error;

  const suggestions = audit.blocks.flatMap((b) =>
    b.rewrites.map((content, variant_index) => ({
      user_id: userId,
      audit_id: data.id,
      block: b.block,
      variant_index,
      content,
      impact: b.impact,
    })),
  );
  const questions = audit.questions.map((q, position) => ({
    user_id: userId,
    audit_id: data.id,
    block: q.block,
    question: q.question,
    proof_label: q.proof_label,
    position,
  }));

  const results = await Promise.all([
    suggestions.length ? admin.from('audit_suggestions').insert(suggestions) : null,
    questions.length ? admin.from('audit_questions').insert(questions) : null,
  ]);
  const failed = results.find((r) => r?.error);
  if (failed?.error) {
    await admin.from('audits').delete().eq('id', data.id);
    throw failed.error;
  }
  return data.id;
}

serve(async (_req, { userId }) => {
  const { input, balance } = await loadProfileInput(userId);
  if (balance < COSTS.audit) throw new HttpError(402, 'insufficient_credits');
  await ensureNoAuditRunning(userId);
  const client = openaiClient();

  const { result, balance: creditsBalance } = await tracked(
    userId,
    'audit',
    COSTS.audit,
    async () => {
      const { data, usage } = await generateJson(client, {
        model: MODEL,
        effort: 'low',
        system: AUDIT_SYSTEM_PROMPT,
        user: buildAuditInput(input),
        schemaName: 'audit_linkedin',
        schema: AUDIT_SCHEMA,
      });
      const audit = normalizeAudit(data);
      if (audit.blocks.every((b) => !b.diagnostic)) throw new Error('audit vide');
      const auditId = await saveAudit(userId, audit);
      return { result: { auditId, score: audit.score_global }, usage };
    },
  );

  return { audit_id: result.auditId, score_global: result.score, credits_balance: creditsBalance };
});
