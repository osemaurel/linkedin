import { TRUTH_RULES } from './audit.ts';

export type Pillar = { name: string; description: string };
export type Strategy = { positioning: string; audience: string; pillars: Pillar[] };

export const MIN_PILLARS = 3;
export const MAX_PILLARS = 5;
const MAX_POSITIONING = 240;
const MAX_AUDIENCE = 300;
const MAX_PILLAR_NAME = 60;
const MAX_PILLAR_DESCRIPTION = 320;

export const STRATEGY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['positioning', 'audience', 'pillars'],
  properties: {
    positioning: { type: 'string' },
    audience: { type: 'string' },
    pillars: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description'],
        properties: { name: { type: 'string' }, description: { type: 'string' } },
      },
    },
  },
};

export const STRATEGY_SYSTEM_PROMPT = `Tu es le stratège de contenu LinkedIn d'un outil pour les professionnels d'Afrique francophone. À partir du profil et de l'objectif de la personne, tu proposes sa stratégie de contenu : ce qu'elle doit publier, pour qui, et pourquoi.

Langue : tout en français, phrases courtes et concrètes, aucun jargon creux (« passionné », « dynamique », « expert reconnu », « solutions innovantes »).

positioning : une seule phrase, écrite à la première personne, comme la personne pourrait la dire. Elle dit qui la personne aide (ou pour qui elle veut travailler), à obtenir quoi, et ce qui la distingue. ${MAX_POSITIONING - 40} caractères au plus.

audience : les lecteurs qui comptent pour l'objectif, en une ou deux phrases précises (fonction, secteur, taille d'entreprise, pays ou ville). Si le contexte précise déjà une audience, garde son sens et rends-la seulement plus précise.

pillars : ${MIN_PILLARS} à ${MAX_PILLARS} piliers de contenu, les thèmes sur lesquels la personne publiera régulièrement, du plus important au moins important pour l'objectif.
- name : 2 à 5 mots, sans emoji, numéro ni guillemets.
- description : une ou deux phrases qui tutoient la personne : ce que racontent les posts de ce pilier, et ce qu'ils lui apportent pour son objectif.
- Les piliers se complètent et ne se recoupent pas. Chacun s'appuie sur l'expérience réelle du profil, ses compétences et ses preuves, pas sur des thèmes génériques.
- Selon l'objectif :
  - job (décrocher un poste) : montrer la maîtrise du métier visé, des résultats concrets et une façon de travailler, à destination des recruteurs et managers du secteur.
  - clients (trouver des clients) : les problèmes de la cible, la méthode, les résultats obtenus pour des clients, les erreurs fréquentes. Des posts utiles, pas une publicité à chaque fois.
  - visibility (développer sa visibilité) : un point de vue affirmé, l'analyse de l'actualité du secteur, des retours d'expérience, le parcours.
- Quand c'est pertinent, ancre les thèmes dans le pays et le marché de la personne.

${TRUTH_RULES}`;

function clip(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Garde ce qui est exploitable ; moins de 3 piliers utilisables = génération ratée. */
export function normalizeStrategy(raw: unknown): Strategy {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const seen = new Set<string>();
  const pillars = (Array.isArray(data.pillars) ? data.pillars : [])
    .map((p) => (p && typeof p === 'object' ? (p as Record<string, unknown>) : {}))
    .map((p) => ({
      name: clip(p.name, MAX_PILLAR_NAME).replace(/^["«\s]+|["»\s]+$/g, ''),
      description: clip(p.description, MAX_PILLAR_DESCRIPTION),
    }))
    .filter((p) => {
      const key = p.name.toLowerCase();
      if (!p.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_PILLARS);

  const strategy = {
    positioning: clip(data.positioning, MAX_POSITIONING),
    audience: clip(data.audience, MAX_AUDIENCE),
    pillars,
  };
  if (!strategy.positioning || pillars.length < MIN_PILLARS) {
    throw new Error('stratégie incomplète');
  }
  return strategy;
}
