import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.9.1';
import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { admin, anonKey, HttpError, readJson, serve, supabaseUrl } from '../_shared/http.ts';
import {
  EMPTY_PROFILE,
  normalizeProfile,
  PROFILE_SCHEMA,
  SYSTEM_PROMPT,
  toDbDate,
  type ParsedProfile,
} from './profile.ts';

const MODEL = 'gpt-5.4-mini';
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 100_000;
const MAX_PASTE_FIELD_CHARS = 20_000;

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
    console.error('parse-profile : lecture PDF impossible', err);
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
      // Le collage ne demande pas les compétences : on garde celles déjà saisies.
      ...(profile.skills.length ? { skills: profile.skills } : {}),
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

serve(async (req, { userId, authHeader }) => {
  const body = await readJson(req);
  let text: string;
  let rawSource: Record<string, unknown>;
  let pasted: { headline: string | null; about: string | null } | null = null;

  if (body.source === 'pdf' && typeof body.path === 'string') {
    text = await readPdf(authHeader, userId, body.path);
    rawSource = { source: 'pdf', storage_path: body.path, text };
  } else if (body.source === 'paste') {
    const headline = pastedField(body.headline);
    const about = pastedField(body.about);
    const experiences = pastedField(body.experiences);
    if (!headline && !about && !experiences) throw new HttpError(400, 'empty_paste');

    text = [
      headline && `Titre : ${headline}`,
      about && `Infos :\n${about}`,
      experiences && `Expérience :\n${experiences}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    rawSource = { source: 'paste', text };
    pasted = { headline, about };

    // Sans bloc d'expériences, rien à découper : pas d'appel au LLM.
    if (!experiences) {
      const profile = { ...EMPTY_PROFILE, headline, about };
      await saveProfile(userId, profile, rawSource);
      return { headline, experiences: 0 };
    }
  } else {
    throw new HttpError(400, 'bad_request');
  }

  if (text.length > MAX_TEXT_CHARS) throw new HttpError(413, 'too_long');
  const client = openaiClient();

  const { result: profile } = await tracked(userId, 'profile_parse', 0, async () => {
    const { data, usage } = await generateJson(client, {
      model: MODEL,
      effort: 'low',
      system: SYSTEM_PROMPT,
      user: `<profil>\n${text}\n</profil>`,
      schemaName: 'profil_linkedin',
      schema: PROFILE_SCHEMA,
    });
    const parsed = normalizeProfile(data);
    // Le titre et les infos collés sont gardés tels quels ; le LLM ne sert qu'à
    // découper le bloc d'expériences, en texte libre.
    const result = pasted ? { ...parsed, ...pasted } : parsed;
    await saveProfile(userId, result, rawSource);
    return { result, usage };
  });

  return { headline: profile.headline, experiences: profile.experiences.length };
});
