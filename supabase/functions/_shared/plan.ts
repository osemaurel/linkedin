import { TRUTH_RULES } from './audit.ts';
import { admin } from './http.ts';

export const HORIZONS = [30, 60, 90] as const;
export const RHYTHMS = [2, 3] as const;
export type Horizon = (typeof HORIZONS)[number];
export type Rhythm = (typeof RHYTHMS)[number];
export type Format = 'text' | 'carousel' | 'image';
const FORMATS: readonly Format[] = ['text', 'carousel', 'image'];
const MAX_ANGLE = 200;

/** Jours de publication (0 = dimanche) : milieu de semaine à 2 posts, lundi-mercredi-vendredi à 3. */
const WEEKDAYS: Record<Rhythm, number[]> = { 2: [2, 4], 3: [1, 3, 5] };

export type StrategyContext = {
  positioning: string | null;
  pillars: { id: string; name: string; description: string | null }[];
};

export async function loadStrategy(userId: string): Promise<StrategyContext> {
  const [strategic, pillars] = await Promise.all([
    admin.from('strategic_profiles').select('positioning').eq('user_id', userId).maybeSingle(),
    admin
      .from('content_pillars')
      .select('id, name, description')
      .eq('user_id', userId)
      .order('position')
      .order('created_at'),
  ]);
  if (strategic.error) throw strategic.error;
  if (pillars.error) throw pillars.error;
  return {
    positioning: strategic.data?.positioning ?? null,
    pillars: pillars.data.filter((p) => p.name.trim()),
  };
}

export type ScheduledSlot = {
  number: number;
  date: string; // AAAA-MM-JJ
  pillar: StrategyContext['pillars'][number];
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Dates fixées par le serveur, à partir de demain ; les piliers tournent dans leur ordre. */
export function scheduleSlots(
  horizon: Horizon,
  rhythm: Rhythm,
  pillars: StrategyContext['pillars'],
  today = new Date(),
): { startDate: string; slots: ScheduledSlot[] } {
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1),
  );
  const slots: ScheduledSlot[] = [];
  for (let i = 0; i < horizon; i++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    if (!WEEKDAYS[rhythm].includes(day.getUTCDay())) continue;
    slots.push({
      number: slots.length + 1,
      date: isoDay(day),
      pillar: pillars[slots.length % pillars.length],
    });
  }
  return { startDate: isoDay(start), slots };
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
export const frenchDay = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));

export function buildStrategyInput(strategy: StrategyContext): string {
  const pillars = strategy.pillars
    .map((p, i) => `${i + 1}. ${p.name}${p.description ? ` : ${p.description}` : ''}`)
    .join('\n');
  return `<strategie>
Positionnement : ${strategy.positioning?.trim() || '(non précisé)'}
Piliers :
${pillars}
</strategie>`;
}

const FORMAT_RULES = `format : text (post texte), carousel (contenu en étapes : méthode, liste, comparaison, checklist) ou image (une seule idée forte : un chiffre clé, une citation, un avant/après).`;

const ANGLE_RULES = `angle : l'idée précise du post, en une phrase de ${MAX_ANGLE - 40} caractères au plus, formulée comme un titre de travail que la personne comprend tout de suite. Par exemple « Les 3 chiffres que je regarde chaque lundi avec un dirigeant de PME ». Un angle concret, jamais un thème vague (« Parler de gestion »). Écrit en français, à la première personne quand la personne parle d'elle.`;

export const PLAN_SYSTEM_PROMPT = `Tu es le planificateur éditorial LinkedIn d'un outil pour les professionnels d'Afrique francophone. Tu reçois le profil de la personne, sa stratégie (positionnement et piliers) et la liste de ses créneaux de publication, chacun avec sa date et son pilier. Pour chaque créneau, tu proposes un angle et un format.

${ANGLE_RULES}

${FORMAT_RULES} Sur l'ensemble du plan : environ 6 textes, 3 carrousels et 1 image pour 10 créneaux.

Règles :
- L'angle sert le pilier du créneau et l'objectif de la personne.
- Varie le type d'angle d'un créneau à l'autre : retour d'expérience, conseil pratique, erreur fréquente, chiffre ou preuve, prise de position, coulisses, question posée à l'audience. Jamais deux angles proches dans le plan.
- Appuie-toi sur l'expérience, les compétences et les preuves du profil, et sur le pays de la personne quand c'est pertinent.
- Renvoie exactement un élément par créneau, avec son numéro.

${TRUTH_RULES}`;

export const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slots'],
  properties: {
    slots: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['number', 'format', 'angle'],
        properties: {
          number: { type: 'integer' },
          format: { type: 'string', enum: FORMATS },
          angle: { type: 'string' },
        },
      },
    },
  },
};

export function buildSlotsInput(slots: ScheduledSlot[]): string {
  return `<creneaux>
${slots.map((s) => `${s.number}. ${frenchDay(s.date)} · pilier : ${s.pillar.name}`).join('\n')}
</creneaux>`;
}

function clipAngle(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["«\s]+|["»\s]+$/g, '');
  return text.length > MAX_ANGLE ? `${text.slice(0, MAX_ANGLE - 1).trimEnd()}…` : text;
}

const asFormat = (value: unknown): Format =>
  FORMATS.includes(value as Format) ? (value as Format) : 'text';

export type PlannedSlot = ScheduledSlot & { format: Format; angle: string };

/** Un angle par créneau, sinon la génération est considérée comme ratée. */
export function normalizePlan(raw: unknown, slots: ScheduledSlot[]): PlannedSlot[] {
  const items = (raw as { slots?: unknown })?.slots;
  const byNumber = new Map<number, { format: Format; angle: string }>();
  for (const item of Array.isArray(items) ? items : []) {
    const i = item as { number?: unknown; format?: unknown; angle?: unknown };
    const angle = clipAngle(i.angle);
    if (typeof i.number === 'number' && angle) {
      byNumber.set(i.number, { format: asFormat(i.format), angle });
    }
  }
  const planned = slots.map((s) => ({ ...s, ...byNumber.get(s.number) }));
  if (planned.some((s) => !s.angle)) throw new Error('plan incomplet');
  return planned as PlannedSlot[];
}

// ---------------------------------------------------------------------------
// Un seul créneau
// ---------------------------------------------------------------------------

export const SLOT_SYSTEM_PROMPT = `Tu proposes un nouvel angle pour un seul créneau du plan éditorial LinkedIn d'un professionnel d'Afrique francophone. Le nouvel angle sert le pilier du créneau et l'objectif de la personne, et se distingue nettement de l'angle actuel comme des autres angles du plan.

${ANGLE_RULES}

${FORMAT_RULES} Choisis le format qui sert le mieux le nouvel angle.

Appuie-toi sur l'expérience, les compétences et les preuves du profil.

${TRUTH_RULES}`;

export const SLOT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['format', 'angle'],
  properties: {
    format: { type: 'string', enum: FORMATS },
    angle: { type: 'string' },
  },
};

export function normalizeSlot(raw: unknown): { format: Format; angle: string } {
  const r = (raw ?? {}) as { format?: unknown; angle?: unknown };
  const angle = clipAngle(r.angle);
  if (!angle) throw new Error('angle vide');
  return { format: asFormat(r.format), angle };
}
