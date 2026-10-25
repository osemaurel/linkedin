import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0';
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.9.1';
import {
  EMPTY_PROFILE,
  normalizeProfile,
  PROFILE_SCHEMA,
  SYSTEM_PROMPT,
  toDbDate,
  type ParsedProfile,
} from './profile.ts';

const MODEL = 'claude-opus-5-5';
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 100_000;
const MAX_PASTE_FIELD_CHARS = 20_000;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

type PdfRequest = { source: 'pdf'; path: string };
type PasteRequest = { source: 'paste'; headline?: unknown; about?: unknown; experiences?: unknown };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function readBody(req: Request): Promise<PdfRequest | PasteRequest> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, 'bad_request');
  }
  const b = body as Record<string, unknown> | null;
  if (b?.source === 'pdf' && typeof b.path === 'string') return { source: 'pdf', path: b.path };
  if (b?.source === 'paste') return b as PasteRequest;
  throw new HttpError(400, 'bad_request');
}

async function readPdf(authHeader: string, userId: string, path: string): Promise<string> {
  if (!path.startsWith(`${userId}/`) || path.includes('..')) {
    throw new HttpError(403, 'forbidden_path');
  }
  // Client à l'identité de l'utilisateur : la RLS du bucket s'applique au téléchargement.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: file, error } = await userClient.storage.from('uploads').download(path);
  if (error || !file) throw new HttpError(404, 'pdf_not_found');
  if (file.size > MAX_PDF_BYTES) throw new HttpError(413, 'pdf_too_large');

  let text: string;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    text = (await extractText(pdf, { mergePages: true })).text;
  } catch (err) {
    console.error('parse-profile: lecture PDF impossible', err);
    throw new HttpError(422, 'pdf_unreadable');
  }
  if (text.trim().length < 50) throw new HttpError(422, 'pdf_no_text');
  return text;
}

function pastedField(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length > MAX_PASTE_FIELD_CHARS) throw new HttpError(413, 'too_long');
  return trimmed === '' ? null : trimmed;
}

async function structureProfile(userId: string, text: string): Promise<ParsedProfile> {
  if (text.length > MAX_TEXT_CHARS) throw new HttpError(413, 'too_long');
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new HttpError(503, 'llm_not_configured');

  const { data: generation, error } = await admin
    .from('generations')
    .insert({ user_id: userId, kind: 'profile_parse', cost_credits: 0 })
    .select('id')
    .single();
  if (error) throw error;

  const anthropic = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: PROFILE_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `<profil>\n${text}\n</profil>` }],
    });
    if (response.stop_reason !== 'end_turn') {
      throw new Error(`stop_reason=${response.stop_reason}`);
    }
    const block = response.content.find(
      (b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text',
    );
    if (!block) throw new Error('réponse sans texte');
    const profile = normalizeProfile(JSON.parse(block.text));

    const usage = response.usage;
    await admin
      .from('generations')
      .update({
        status: 'success',
        tokens_in:
          usage.input_tokens +
          (usage.cache_creation_input_tokens ?? 0) +
          (usage.cache_read_input_tokens ?? 0),
        tokens_out: usage.output_tokens,
      })
      .eq('id', generation.id);
    return profile;
  } catch (err) {
    console.error('parse-profile: échec du LLM', err);
    await admin
      .from('generations')
      .update({ status: 'failed', error: String(err).slice(0, 500) })
      .eq('id', generation.id);
    throw new HttpError(502, 'llm_failed');
  }
}

async function saveProfile(
  userId: string,
  profile: ParsedProfile,
  rawSource: Record<string, unknown>,
) {
  const { error: spError } = await admin.from('strategic_profiles').upsert(
    {
      user_id: userId,
      headline: profile.headline,
      about: profile.about,
      raw_source: { ...rawSource, parsed: profile, parsed_at: new Date().toISOString() },
    },
    { onConflict: 'user_id' },
  );
  if (spError) throw spError;

  // La nouvelle source remplace l'ancienne : les expériences sont réécrites en entier.
  const { error: delError } = await admin.from('experiences').delete().eq('user_id', userId);
  if (delError) throw delError;
  if (profile.experiences.length > 0) {
    const { error: insError } = await admin.from('experiences').insert(
      profile.experiences.map((e, position) => ({
        user_id: userId,
        title: e.title,
        company: e.company,
        start_date: toDbDate(e.start_date),
        end_date: toDbDate(e.end_date),
        description: e.description,
        position,
      })),
    );
    if (insError) throw insError;
  }

  // Ne jamais demander ce qu'on peut deviner : nom et pays viennent du profil,
  // sans écraser ce que l'utilisateur aurait déjà renseigné.
  if (profile.full_name) {
    await admin
      .from('profiles')
      .update({ full_name: profile.full_name })
      .eq('id', userId)
      .is('full_name', null);
  }
  if (profile.country) {
    await admin
      .from('profiles')
      .update({ country: profile.country })
      .eq('id', userId)
      .is('country', null);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'unauthorized');
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) throw new HttpError(401, 'unauthorized');
    const userId = auth.user.id;

    const body = await readBody(req);
    let profile: ParsedProfile;
    let rawSource: Record<string, unknown>;

    if (body.source === 'pdf') {
      const text = await readPdf(authHeader, userId, body.path);
      profile = await structureProfile(userId, text);
      rawSource = { source: 'pdf', storage_path: body.path, text };
    } else {
      const headline = pastedField(body.headline);
      const about = pastedField(body.about);
      const experiences = pastedField(body.experiences);
      if (!headline && !about && !experiences) throw new HttpError(400, 'empty_paste');

      const text = [
        headline && `Titre : ${headline}`,
        about && `Infos :\n${about}`,
        experiences && `Expérience :\n${experiences}`,
      ]
        .filter(Boolean)
        .join('\n\n');
      // Le titre et les infos collés sont gardés tels quels ; seul le bloc
      // d'expériences, en texte libre, a besoin du LLM pour être découpé.
      const parsed = experiences ? await structureProfile(userId, text) : EMPTY_PROFILE;
      profile = { ...parsed, headline, about };
      rawSource = { source: 'paste', text };
    }

    await saveProfile(userId, profile, rawSource);
    return json(200, { headline: profile.headline, experiences: profile.experiences.length });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.code });
    console.error('parse-profile: erreur inattendue', err);
    return json(500, { error: 'internal' });
  }
});
