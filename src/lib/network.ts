import type { Enums, TablesUpdate } from './database.types';
import { invokeFunction } from './edgeFunctions';
import { todayIso } from './plan';
import { supabase } from './supabase';

export type ContactStatus = Enums<'contact_status'>;
export type MessageKind = Enums<'contact_message_kind'>;

export const STATUSES: { value: ContactStatus; label: string }[] = [
  { value: 'contacted', label: 'Contacté' },
  { value: 'replied', label: 'A répondu' },
  { value: 'in_discussion', label: 'En discussion' },
  { value: 'closed', label: 'Conclu' },
];
export const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.value, s.label])) as Record<
  ContactStatus,
  string
>;

export const MESSAGE_KINDS: { value: MessageKind; label: string; hint: string; max: number }[] = [
  {
    value: 'connection_note',
    label: 'Note de connexion',
    hint: 'À joindre à l’invitation. 300 caractères au plus.',
    max: 300,
  },
  {
    value: 'follow_up',
    label: 'Message de suivi',
    hint: 'À envoyer une fois l’invitation acceptée.',
    max: 2000,
  },
  { value: 'reminder', label: 'Relance', hint: 'Si le suivi reste sans réponse.', max: 1000 },
];

/** Délai avant la relance suivante, une fois ce message envoyé. */
const FOLLOWUP_DAYS: Record<MessageKind, number | null> = {
  connection_note: 5,
  follow_up: 7,
  reminder: null,
};

export type SavedQuery = { label: string; keywords: string; filters: string[]; why: string };
export type Targets = {
  jobTitles: string[];
  sectors: string[];
  countries: string[];
  companySizes: string[];
  queries: SavedQuery[];
};
export type ContactMessage = { id: string; kind: MessageKind; body: string; sentAt: string | null };
export type Contact = {
  id: string;
  fullName: string;
  headline: string | null;
  company: string | null;
  profileUrl: string | null;
  status: ContactStatus;
  /** Jour de relance prévu (AAAA-MM-JJ). */
  followupDate: string | null;
  messages: ContactMessage[];
};
export type NetworkData = { targets: Targets | null; contacts: Contact[] };

const ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

async function check(request: PromiseLike<{ error: unknown }>) {
  const { error } = await request;
  if (error) throw new Error(ERROR);
}

export async function fetchNetwork(userId: string): Promise<NetworkData> {
  const [targets, contacts, messages] = await Promise.all([
    supabase.from('targets').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('contacts')
      .select('id, full_name, headline, company, profile_url, status, next_followup_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('contact_messages')
      .select('id, contact_id, kind, body, sent_at')
      .eq('user_id', userId)
      .order('created_at'),
  ]);
  for (const r of [targets, contacts, messages]) if (r.error) throw r.error;

  const order = MESSAGE_KINDS.map((k) => k.value);
  const byContact = new Map<string, ContactMessage[]>();
  for (const m of messages.data!) {
    byContact.set(m.contact_id, [
      ...(byContact.get(m.contact_id) ?? []),
      { id: m.id, kind: m.kind, body: m.body, sentAt: m.sent_at },
    ]);
  }

  const t = targets.data;
  return {
    targets: t
      ? {
          jobTitles: t.job_titles,
          sectors: t.sectors,
          countries: t.countries,
          companySizes: t.company_sizes,
          queries: Array.isArray(t.saved_queries) ? (t.saved_queries as SavedQuery[]) : [],
        }
      : null,
    contacts: contacts.data!.map((c) => ({
      id: c.id,
      fullName: c.full_name,
      headline: c.headline,
      company: c.company,
      profileUrl: c.profile_url,
      status: c.status,
      followupDate: c.next_followup_at?.slice(0, 10) ?? null,
      messages: (byContact.get(c.id) ?? []).sort(
        (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
      ),
    })),
  };
}

export const saveTargets = (userId: string, patch: TablesUpdate<'targets'>) =>
  check(
    supabase
      .from('targets')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId),
  );

/** Jour calendaire → instant stocké à midi UTC, sans glissement de fuseau. */
const dayToTimestamp = (day: string | null) => (day ? `${day}T12:00:00Z` : null);

export function addDays(days: number, from = todayIso()): string {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const saveContactStatus = (id: string, status: ContactStatus) =>
  check(
    supabase
      .from('contacts')
      .update(status === 'closed' ? { status, next_followup_at: null } : { status })
      .eq('id', id),
  );

export const saveFollowup = (id: string, day: string | null) =>
  check(
    supabase
      .from('contacts')
      .update({ next_followup_at: dayToTimestamp(day) })
      .eq('id', id),
  );

export const deleteContact = (id: string) => check(supabase.from('contacts').delete().eq('id', id));

export const saveMessage = (id: string, body: string) =>
  check(supabase.from('contact_messages').update({ body }).eq('id', id));

/** Message envoyé : la prochaine relance se cale automatiquement. */
export async function markSent(contactId: string, message: ContactMessage, sent: boolean) {
  const sentAt = sent ? new Date().toISOString() : null;
  await check(supabase.from('contact_messages').update({ sent_at: sentAt }).eq('id', message.id));
  const days = FOLLOWUP_DAYS[message.kind];
  const followup = sent && days !== null ? addDays(days) : null;
  if (sent) await saveFollowup(contactId, followup);
  return { sentAt, followup };
}

export function isDue(contact: Contact): boolean {
  return (
    contact.status !== 'closed' &&
    contact.followupDate !== null &&
    contact.followupDate <= todayIso()
  );
}

/** Recherche de personnes LinkedIn, prête à ouvrir en un clic. */
export const linkedinSearchUrl = (keywords: string) =>
  `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;

/** Seule une URL de profil LinkedIn devient un lien cliquable. */
export const isLinkedinProfileUrl = (url: string | null): url is string =>
  Boolean(url && /^https:\/\/www\.linkedin\.com\/in\/[A-Za-z0-9\-_%.]+$/.test(url));

export function generateTargeting() {
  return invokeFunction<{ queries: number; credits_balance: number }>(
    'generate-targeting',
    {},
    {
      insufficient_credits: 'Ton solde ne couvre pas ce ciblage.',
      profile_missing: 'Commence par présenter ton profil.',
      llm_not_configured: 'Le ciblage est momentanément indisponible. Réessaie plus tard.',
      llm_failed: 'Le ciblage n’a pas abouti. Aucun crédit n’a été débité : tu peux relancer.',
    },
  );
}

export const MIN_PROFILE_TEXT = 80;
export const MAX_PROFILE_TEXT = 8000;

export function writeOutreach(profileText: string, profileUrl: string) {
  return invokeFunction<{ contact_id: string; credits_balance: number }>(
    'write-outreach',
    { profile_text: profileText, profile_url: profileUrl || null },
    {
      insufficient_credits: 'Ton solde ne couvre pas ces messages.',
      too_short: 'Colle davantage du profil : au moins le nom, le titre et une expérience.',
      too_long: 'C’est trop long : garde le nom, le titre, les Infos et les expériences.',
      bad_url: 'Cette adresse n’est pas celle d’un profil LinkedIn (linkedin.com/in/…).',
      profile_missing: 'Commence par présenter ton profil.',
      llm_not_configured: 'Service momentanément indisponible. Réessaie plus tard.',
      llm_failed: 'Les messages n’ont pas abouti. Aucun crédit n’a été débité : tu peux relancer.',
    },
  );
}
