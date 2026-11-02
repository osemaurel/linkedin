import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import {
  buildRewriteInput,
  normalizeRewrites,
  REWRITE_SCHEMA,
  REWRITE_SYSTEM_PROMPT,
  type Block,
  type Impact,
} from '../_shared/audit.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import { COSTS } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.5';
const MAX_ANSWER_CHARS = 300;

async function replaceSuggestions(
  userId: string,
  auditId: string,
  block: Block,
  impact: Impact,
  rewrites: string[],
) {
  const { data: old, error } = await admin
    .from('audit_suggestions')
    .select('id')
    .eq('audit_id', auditId)
    .eq('block', block);
  if (error) throw error;

  // Les nouvelles versions d'abord : en cas d'échec, les anciennes restent en place.
  const { error: insertError } = await admin.from('audit_suggestions').insert(
    rewrites.map((content, variant_index) => ({
      user_id: userId,
      audit_id: auditId,
      block,
      variant_index,
      content,
      impact,
    })),
  );
  if (insertError) throw insertError;
  if (old.length) {
    const { error: deleteError } = await admin
      .from('audit_suggestions')
      .delete()
      .in(
        'id',
        old.map((o) => o.id),
      );
    if (deleteError) throw deleteError;
  }
}

serve(async (req, { userId }) => {
  const body = await readJson(req);
  const questionId = typeof body.question_id === 'string' ? body.question_id : '';
  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (!questionId || !answer) throw new HttpError(400, 'bad_request');
  if (answer.length > MAX_ANSWER_CHARS) throw new HttpError(413, 'too_long');

  // Passage atomique pending → answered : un double envoi ne crée pas deux preuves.
  const { data: question, error } = await admin
    .from('audit_questions')
    .update({ status: 'answered', answer, answered_at: new Date().toISOString() })
    .eq('id', questionId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select('id, audit_id, block, question, proof_label')
    .maybeSingle();
  if (error) throw error;
  if (!question) throw new HttpError(409, 'question_closed');

  // La réponse devient une preuve avant tout appel au modèle : elle n'est jamais perdue.
  const { data: proof, error: proofError } = await admin
    .from('proofs')
    .insert({
      user_id: userId,
      label: question.proof_label,
      value: answer,
      context: question.question,
      source: 'entretien',
    })
    .select('id')
    .single();
  if (proofError) throw proofError;
  await admin.from('audit_questions').update({ proof_id: proof.id }).eq('id', question.id);

  const [{ input }, audit] = await Promise.all([
    loadProfileInput(userId),
    admin.from('audits').select('scores').eq('id', question.audit_id).single(),
  ]);
  if (audit.error) throw audit.error;
  const block = question.block as Block;
  const current = (audit.data.scores as Record<string, { diagnostic?: string; impact?: Impact }>)[
    block
  ];
  const client = openaiClient();

  const { result: count } = await tracked(
    userId,
    'block_rewrite',
    COSTS.block_rewrite,
    async () => {
      const { data, usage } = await generateJson(client, {
        model: MODEL,
        effort: 'low',
        system: REWRITE_SYSTEM_PROMPT,
        user: buildRewriteInput(input, block, current?.diagnostic ?? '', {
          question: question.question,
          answer,
        }),
        schemaName: 'reecritures_bloc',
        schema: REWRITE_SCHEMA,
      });
      const rewrites = normalizeRewrites(data, block);
      if (!rewrites.length) throw new Error('aucune réécriture');
      await replaceSuggestions(
        userId,
        question.audit_id,
        block,
        current?.impact ?? 'medium',
        rewrites,
      );
      return { result: rewrites.length, usage };
    },
  );

  return { block, rewrites: count, proof_id: proof.id };
});
