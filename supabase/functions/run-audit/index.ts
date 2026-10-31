import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { admin, HttpError, serve } from '../_shared/http.ts';
import {
  AUDIT_SCHEMA,
  AUDIT_SYSTEM_PROMPT,
  buildAuditInput,
  normalizeAudit,
  type AuditInput,
  type AuditResult,
  type Objective,
} from './audit.ts';

const MODEL = 'gpt-5.5';
// Doit rester égal à AUDIT_COST côté application (src/lib/audit.ts).
const AUDIT_COST = 5;

type ParsedSource = {
  source?: AuditInput['source'];
  parsed?: { skills?: unknown; education?: unknown; languages?: unknown };
};

async function loadInput(userId: string): Promise<{ input: AuditInput; balance: number }> {
  const [strategic, profile, experiences, proofs] = await Promise.all([
    admin
      .from('strategic_profiles')
      .select('headline, about, offer, target_audience, raw_source')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('profiles').select('objective, country, credits_balance').eq('id', userId).single(),
    admin
      .from('experiences')
      .select('title, company, start_date, end_date, description')
      .eq('user_id', userId)
      .order('position'),
    admin.from('proofs').select('label, value, context').eq('user_id', userId).order('created_at'),
  ]);
  if (strategic.error) throw strategic.error;
  if (profile.error) throw profile.error;
  if (experiences.error) throw experiences.error;
  if (proofs.error) throw proofs.error;
  if (!strategic.data || !profile.data.objective) throw new HttpError(409, 'profile_missing');

  const raw = (strategic.data.raw_source ?? {}) as ParsedSource;
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    balance: profile.data.credits_balance,
    input: {
      objective: profile.data.objective as Objective,
      offer: strategic.data.offer,
      targetAudience: strategic.data.target_audience,
      country: profile.data.country,
      source: raw.source ?? null,
      headline: strategic.data.headline,
      about: strategic.data.about,
      experiences: experiences.data ?? [],
      skills: list(raw.parsed?.skills),
      education: list(raw.parsed?.education),
      languages: list(raw.parsed?.languages),
      proofs: proofs.data ?? [],
    },
  };
}

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

  const rows = audit.blocks.flatMap((b) =>
    b.rewrites.map((content, variant_index) => ({
      user_id: userId,
      audit_id: data.id,
      block: b.block,
      variant_index,
      content,
      impact: b.impact,
    })),
  );
  if (rows.length) {
    const { error: suggestionsError } = await admin.from('audit_suggestions').insert(rows);
    if (suggestionsError) {
      await admin.from('audits').delete().eq('id', data.id);
      throw suggestionsError;
    }
  }
  return data.id;
}

serve(async (_req, { userId }) => {
  const { input, balance } = await loadInput(userId);
  if (balance < AUDIT_COST) throw new HttpError(402, 'insufficient_credits');
  await ensureNoAuditRunning(userId);
  const client = openaiClient();

  const { result, balance: creditsBalance } = await tracked(
    userId,
    'audit',
    AUDIT_COST,
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
