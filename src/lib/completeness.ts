import type { FullProfile } from '@/hooks/useFullProfile';

export type ProfileTab = 'donnees' | 'contexte' | 'preuves';

type Check = { ok: boolean; weight: number; hint: string; tab: ProfileTab };

/** Complétude indicative du Profil Stratégique : jamais bloquante, elle oriente la suite. */
export function computeCompleteness(p: FullProfile): {
  percent: number;
  next: { hint: string; tab: ProfileTab } | null;
} {
  const describedExperience = p.experiences.some(
    (e) => e.title.trim() && (e.description ?? '').trim().length >= 100,
  );
  const proofs = p.proofs.filter((x) => x.label.trim() || (x.value ?? '').trim()).length;
  const checks: Check[] = [
    { ok: Boolean(p.headline.trim()), weight: 15, hint: 'Ajoute ton titre', tab: 'donnees' },
    {
      ok: p.about.trim().length >= 300,
      weight: 15,
      hint: 'Étoffe ta section Infos (300 caractères au moins)',
      tab: 'donnees',
    },
    {
      ok: describedExperience,
      weight: 15,
      hint: 'Décris au moins une expérience',
      tab: 'donnees',
    },
    {
      ok: p.skills.length >= 5,
      weight: 10,
      hint: 'Ajoute au moins 5 compétences',
      tab: 'donnees',
    },
    { ok: Boolean(p.objective), weight: 10, hint: 'Choisis ton objectif', tab: 'contexte' },
    {
      ok: Boolean(p.offer.trim()),
      weight: 10,
      hint: 'Dis ce que tu cherches concrètement',
      tab: 'contexte',
    },
    {
      ok: Boolean(p.targetAudience.trim()),
      weight: 10,
      hint: 'Précise à qui tu t’adresses',
      tab: 'contexte',
    },
    { ok: proofs >= 1, weight: 10, hint: 'Ajoute une preuve chiffrée', tab: 'preuves' },
    { ok: proofs >= 3, weight: 5, hint: 'Ajoute une troisième preuve', tab: 'preuves' },
  ];
  const percent = checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0);
  const missing = checks.find((c) => !c.ok);
  return { percent, next: missing ? { hint: missing.hint, tab: missing.tab } : null };
}
