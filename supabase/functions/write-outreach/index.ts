import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { buildAuditInput } from '../_shared/audit.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import {
  buildTargetsInput,
  MAX_PROFILE_TEXT,
  MIN_PROFILE_TEXT,
  normalizeOutreach,
  normalizeProfileUrl,
  OUTREACH_SCHEMA,
  OUTREACH_SYSTEM_PROMPT,
} from '../_shared/network.ts';
import { getCost } from '../_shared/pricing.ts';
import { loadProfileInput } from '../_shared/profileInput.ts';

const MODEL = 'gpt-5.5';

/**
 * Profil collé → contact suivi + note de connexion, message de suivi et relance.
 * Le texte collé sert uniquement à la génération : il n'est pas conservé.
 */
serve(async (req, { userId }) => {
  const body = await readJson(req);
  const profileText = typeof body.profile_text === 'string' ? body.profile_text.trim() : '';
  if (profileText.length < MIN_PROFILE_TEXT) throw new HttpError(400, 'too_short');
  if (profileText.length > MAX_PROFILE_TEXT) throw new HttpError(413, 'too_long');
  const rawUrl = typeof body.profile_url === 'string' ? body.profile_url.trim() : '';
  const profileUrl = normalizeProfileUrl(rawUrl);
  if (rawUrl && !profileUrl) throw new HttpError(400, 'bad_url');

  const [{ input }, targets] = await Promise.all([
    loadProfileInput(userId),
    admin
      .from('targets')
      .select('job_titles, sectors, countries, company_sizes')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (targets.error) throw targets.error;
  const client = openaiClient();

  const { result, balance } = await tracked(
    userId,
    'outreach_message',
    await getCost('outreach_message'),
    async () => {
      const { data, usage } = await generateJson(client, {
        model: MODEL,
        effort: 'low',
        system: OUTREACH_SYSTEM_PROMPT,
        user: `<expediteur>
${buildAuditInput(input)}
${buildTargetsInput(targets.data)}
</expediteur>

<destinataire>
${profileText}
</destinataire>`,
        schemaName: 'messages_approche',
        schema: OUTREACH_SCHEMA,
      });
      const outreach = normalizeOutreach(data);

      const { data: contact, error } = await admin
        .from('contacts')
        .insert({
          user_id: userId,
          full_name: outreach.full_name || 'Contact sans nom',
          headline: outreach.headline || null,
          company: outreach.company || null,
          profile_url: profileUrl,
          status: 'contacted',
        })
        .select('id')
        .single();
      if (error) throw error;

      const { error: messagesError } = await admin.from('contact_messages').insert([
        {
          user_id: userId,
          contact_id: contact.id,
          kind: 'connection_note',
          body: outreach.connection_note,
        },
        { user_id: userId, contact_id: contact.id, kind: 'follow_up', body: outreach.follow_up },
        { user_id: userId, contact_id: contact.id, kind: 'reminder', body: outreach.reminder },
      ]);
      if (messagesError) {
        await admin.from('contacts').delete().eq('id', contact.id);
        throw messagesError;
      }
      return { result: contact.id, usage };
    },
  );

  return { contact_id: result, credits_balance: balance };
});
