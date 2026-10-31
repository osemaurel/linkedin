import OpenAI from 'npm:openai@7.35.0';
import type { ReasoningEffort } from 'npm:openai@7.35.0/resources/shared';
import { admin, HttpError } from './http.ts';

export type Usage = { tokensIn: number; tokensOut: number };

/** Échoue avant toute écriture si la clé manque : aucune génération n'est alors tracée. */
export function openaiClient(): OpenAI {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new HttpError(503, 'llm_not_configured');
  // Sous la limite de 150 s d'une Edge Function ; pas de nouvel essai qui la dépasserait.
  return new OpenAI({ apiKey, timeout: 120_000, maxRetries: 0 });
}

export async function generateJson(
  client: OpenAI,
  params: {
    model: string;
    effort: ReasoningEffort;
    system: string;
    user: string;
    schemaName: string;
    schema: Record<string, unknown>;
  },
): Promise<{ data: unknown; usage: Usage }> {
  const completion = await client.chat.completions.create({
    model: params.model,
    reasoning_effort: params.effort,
    max_completion_tokens: 16000,
    response_format: {
      type: 'json_schema',
      json_schema: { name: params.schemaName, schema: params.schema, strict: true },
    },
    messages: [
      { role: 'developer', content: params.system },
      { role: 'user', content: params.user },
    ],
  });

  const choice = completion.choices[0];
  if (!choice) throw new Error('réponse vide');
  if (choice.message.refusal) throw new Error(`refus du modèle : ${choice.message.refusal}`);
  if (choice.finish_reason !== 'stop' || !choice.message.content) {
    throw new Error(`réponse incomplète (finish_reason=${choice.finish_reason})`);
  }
  return {
    data: JSON.parse(choice.message.content),
    usage: {
      tokensIn: completion.usage?.prompt_tokens ?? 0,
      tokensOut: completion.usage?.completion_tokens ?? 0,
    },
  };
}

/**
 * Trace un appel IA dans generations : ligne insérée AVANT l'appel, consume_credits
 * (qui débite cost_credits) seulement si `run` réussit en entier, statut failed sinon.
 */
export async function tracked<T>(
  userId: string,
  kind: string,
  cost: number,
  run: () => Promise<{ result: T; usage: Usage }>,
): Promise<{ result: T; balance: number }> {
  const { data: generation, error } = await admin
    .from('generations')
    .insert({ user_id: userId, kind, cost_credits: cost })
    .select('id')
    .single();
  if (error) throw error;

  let outcome: { result: T; usage: Usage };
  try {
    outcome = await run();
  } catch (err) {
    console.error(`${kind} : échec`, err);
    await admin
      .from('generations')
      .update({ status: 'failed', error: String(err).slice(0, 500) })
      .eq('id', generation.id);
    throw err instanceof HttpError ? err : new HttpError(502, 'llm_failed');
  }

  const { data: balance, error: consumeError } = await admin.rpc('consume_credits', {
    p_generation_id: generation.id,
    p_tokens_in: outcome.usage.tokensIn,
    p_tokens_out: outcome.usage.tokensOut,
  });
  if (consumeError) throw consumeError;
  return { result: outcome.result, balance: balance as number };
}
