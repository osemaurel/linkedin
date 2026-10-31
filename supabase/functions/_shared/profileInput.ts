import type { AuditInput, Objective } from './audit.ts';
import { admin, HttpError } from './http.ts';

type RawSource = {
  source?: AuditInput['source'];
  parsed?: { education?: unknown; languages?: unknown };
};

/** Tout ce que l'IA sait du profil : Profil Stratégique, expériences et preuves. */
export async function loadProfileInput(
  userId: string,
): Promise<{ input: AuditInput; balance: number }> {
  const [strategic, profile, experiences, proofs] = await Promise.all([
    admin
      .from('strategic_profiles')
      .select('headline, about, offer, target_audience, skills, raw_source')
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

  const raw = (strategic.data.raw_source ?? {}) as RawSource;
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
      skills: list(strategic.data.skills),
      education: list(raw.parsed?.education),
      languages: list(raw.parsed?.languages),
      proofs: proofs.data ?? [],
    },
  };
}
