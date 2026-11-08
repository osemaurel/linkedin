import type { Enums } from './database.types';
import { formatLongDay, todayIso } from './plan';
import { supabase } from './supabase';

export type AuditPoint = { id: string; createdAt: string; score: number };
export type DashSlot = { id: string; date: string; angle: string; postId: string | null };
export type DashPost = {
  id: string;
  createdAt: string;
  status: Enums<'post_status'>;
  firstLine: string;
  slotId: string | null;
};
export type DashContact = {
  id: string;
  fullName: string;
  createdAt: string;
  status: Enums<'contact_status'>;
  followupDate: string | null;
};
export type DashCredit = { createdAt: string; delta: number; reason: Enums<'credit_reason'> };

export type DashboardData = {
  /** Du plus ancien au plus récent. */
  audits: AuditPoint[];
  pendingQuestion: boolean;
  pillars: { count: number; createdAt: string | null };
  plan: { createdAt: string; horizon: number } | null;
  slots: DashSlot[];
  posts: DashPost[];
  hasTargets: boolean;
  contacts: DashContact[];
  credits: DashCredit[];
};

/** Tout ce que lit le tableau de bord, en une passe ; il n'écrit rien. */
export async function fetchDashboard(userId: string): Promise<DashboardData> {
  const [audits, questions, pillars, plans, slots, posts, targets, contacts, credits] =
    await Promise.all([
      supabase
        .from('audits')
        .select('id, created_at, score_global')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('audit_questions')
        .select('audit_id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .limit(10),
      supabase
        .from('content_pillars')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('content_plans')
        .select('created_at, horizon')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('plan_slots')
        .select('id, scheduled_date, angle, post_id')
        .eq('user_id', userId)
        .order('scheduled_date'),
      supabase
        .from('posts')
        .select('id, created_at, status, body, slot_id')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('targets').select('user_id').eq('user_id', userId).maybeSingle(),
      supabase
        .from('contacts')
        .select('id, full_name, created_at, status, next_followup_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('credit_transactions')
        .select('created_at, delta, reason')
        .eq('user_id', userId)
        .in('reason', ['purchase', 'signup_grant', 'manual_adjust', 'refund'])
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
  for (const r of [audits, questions, pillars, plans, slots, posts, targets, contacts, credits]) {
    if (r.error) throw r.error;
  }

  const auditPoints = audits
    .data!.filter((a) => a.score_global !== null)
    .map((a) => ({ id: a.id, createdAt: a.created_at, score: a.score_global as number }))
    .reverse();
  const latestAudit = auditPoints.at(-1)?.id;

  return {
    audits: auditPoints,
    pendingQuestion: questions.data!.some((q) => q.audit_id === latestAudit),
    pillars: { count: pillars.data!.length, createdAt: pillars.data![0]?.created_at ?? null },
    plan: plans.data![0]
      ? { createdAt: plans.data![0].created_at, horizon: plans.data![0].horizon }
      : null,
    slots: slots.data!.map((s) => ({
      id: s.id,
      date: s.scheduled_date,
      angle: s.angle ?? '',
      postId: s.post_id,
    })),
    posts: posts.data!.map((p) => ({
      id: p.id,
      createdAt: p.created_at,
      status: p.status,
      firstLine:
        (p.body ?? '')
          .split('\n')
          .find((l) => l.trim())
          ?.trim() ?? '',
      slotId: p.slot_id,
    })),
    hasTargets: Boolean(targets.data),
    contacts: contacts.data!.map((c) => ({
      id: c.id,
      fullName: c.full_name,
      createdAt: c.created_at,
      status: c.status,
      followupDate: c.next_followup_at?.slice(0, 10) ?? null,
    })),
    credits: credits.data!.map((c) => ({
      createdAt: c.created_at,
      delta: c.delta,
      reason: c.reason,
    })),
  };
}

// ---------------------------------------------------------------------------
// Avancement : le parcours du cadrage, du profil à la prospection.
// ---------------------------------------------------------------------------

export const COMPLETE_PROFILE = 70;

export type Step = { id: string; label: string; done: boolean; to: string };

export function buildSteps(d: DashboardData, completeness: number | null): Step[] {
  const posted = d.posts.some((p) => p.status === 'published');
  return [
    {
      id: 'profile',
      label:
        completeness === null ? 'Compléter ton profil' : `Compléter ton profil (${completeness} %)`,
      done: completeness !== null && completeness >= COMPLETE_PROFILE,
      to: '/profil',
    },
    { id: 'audit', label: 'Faire ton premier audit', done: d.audits.length > 0, to: '/audit' },
    {
      id: 'strategy',
      label: 'Définir ta stratégie de contenu',
      done: d.pillars.count >= 3,
      to: '/strategie',
    },
    { id: 'plan', label: 'Créer ton plan éditorial', done: d.plan !== null, to: '/plan' },
    { id: 'draft', label: 'Rédiger un premier post', done: d.posts.length > 0, to: '/studio' },
    { id: 'publish', label: 'Publier un premier post', done: posted, to: '/studio' },
    {
      id: 'targets',
      label: 'Définir ta cible de prospection',
      done: d.hasTargets,
      to: '/reseau?onglet=ciblage',
    },
    {
      id: 'contact',
      label: 'Aborder une première personne',
      done: d.contacts.length > 0,
      to: '/reseau?onglet=messages',
    },
  ];
}

// ---------------------------------------------------------------------------
// Prochaine action : une seule, la plus utile maintenant.
// ---------------------------------------------------------------------------

export type NextAction = {
  id: string;
  title: string;
  text: string;
  cta: string;
  to: string;
};

const DAY = 86_400_000;
const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY);

/** Ordre de priorité : ce qui est daté ou bloque la suite, puis le parcours, puis l'entretien. */
export function pickNextAction(
  d: DashboardData,
  profile: { percent: number; hint: string | null; tab: string | null } | null,
  today = todayIso(),
): NextAction {
  if (!d.audits.length) {
    return {
      id: 'first-audit',
      title: 'Lance ton premier audit',
      text: 'Ton score, tes points faibles et des versions de ton profil prêtes à copier sur LinkedIn.',
      cta: 'Lancer mon audit',
      to: '/audit',
    };
  }

  const due = d.contacts.filter(
    (c) => c.status !== 'closed' && c.followupDate !== null && c.followupDate <= today,
  );
  if (due.length) {
    return {
      id: 'followups',
      title:
        due.length === 1
          ? `Relance ${due[0].fullName} aujourd’hui`
          : `Relance ${due.length} personnes aujourd’hui`,
      text: 'Les messages sont prêts dans ton suivi : copie, envoie, puis marque-les comme envoyés.',
      cta: 'Ouvrir mon suivi',
      to: '/reseau?onglet=suivi',
    };
  }

  const postById = new Map(d.posts.map((p) => [p.id, p]));
  const recentSlot = d.slots.find(
    (s) => !s.postId && s.date <= today && daysBetween(s.date, today) <= 2,
  );
  if (recentSlot) {
    return {
      id: 'slot-today',
      title: slotTitle(recentSlot.date, today),
      text: recentSlot.angle || 'Ton créneau du jour attend son post.',
      cta: 'Rédiger dans le Studio',
      to: `/studio?slot=${recentSlot.id}`,
    };
  }

  const readyDraft = d.slots
    .filter((s) => s.postId && s.date <= today)
    .map((s) => ({ slot: s, post: postById.get(s.postId as string) }))
    .find((x) => x.post?.status === 'draft');
  if (readyDraft?.post) {
    return {
      id: 'publish-draft',
      title: 'Ton post est prêt : publie-le',
      text: readyDraft.post.firstLine || 'Ton brouillon attend dans le Studio.',
      cta: 'Ouvrir le brouillon',
      to: `/studio?post=${readyDraft.post.id}`,
    };
  }

  if (d.pendingQuestion) {
    return {
      id: 'audit-question',
      title: 'Réponds à la question de ton audit',
      text: 'Une ligne suffit : ta réponse rejoint tes preuves et rend tes propositions plus fortes.',
      cta: 'Répondre',
      to: '/audit',
    };
  }

  if (d.pillars.count === 0) {
    return {
      id: 'strategy',
      title: 'Définis ta stratégie de contenu',
      text: 'Un positionnement en une phrase et 3 à 5 piliers : les thèmes sur lesquels tu publieras.',
      cta: 'Définir ma stratégie',
      to: '/strategie',
    };
  }

  if (!d.plan) {
    return {
      id: 'plan',
      title: 'Crée ton plan éditorial',
      text: 'Tes piliers répartis sur 30, 60 ou 90 jours, avec un angle précis pour chaque publication.',
      cta: 'Créer mon plan',
      to: '/plan',
    };
  }

  if (profile && profile.percent < COMPLETE_PROFILE) {
    return {
      id: 'profile',
      title: 'Complète ton profil',
      text: profile.hint
        ? `${profile.hint} : tes audits et tes posts seront plus précis.`
        : 'Plus ton profil est riche, plus tes audits et tes posts sont précis.',
      cta: 'Compléter mon profil',
      to: profile.tab ? `/profil?onglet=${profile.tab}` : '/profil',
    };
  }

  if (!d.hasTargets) {
    return {
      id: 'targets',
      title: 'Définis ta cible de prospection',
      text: 'Qui contacter, et les recherches LinkedIn prêtes à coller pour les trouver.',
      cta: 'Définir ma cible',
      to: '/reseau?onglet=ciblage',
    };
  }

  const upcoming = d.slots.find(
    (s) => !s.postId && s.date > today && daysBetween(today, s.date) <= 7,
  );
  if (upcoming) {
    return {
      id: 'slot-upcoming',
      title: `Prépare ton post du ${formatLongDay(upcoming.date)}`,
      text: upcoming.angle || 'Un créneau de ton plan arrive.',
      cta: 'Rédiger dans le Studio',
      to: `/studio?slot=${upcoming.id}`,
    };
  }

  const lastAudit = d.audits.at(-1)!;
  if (Date.now() - Date.parse(lastAudit.createdAt) > 30 * DAY) {
    return {
      id: 'reaudit',
      title: 'Relance ton audit',
      text: 'Ton dernier audit date de plus d’un mois : mesure tes progrès depuis.',
      cta: 'Relancer mon audit',
      to: '/audit',
    };
  }

  return {
    id: 'all-good',
    title: 'Tout est à jour',
    text: 'Profite de l’élan : écris un post sur un sujet qui te tient à cœur.',
    cta: 'Ouvrir le Studio',
    to: '/studio',
  };
}

function slotTitle(date: string, today: string): string {
  return date === today ? 'Rédige ton post du jour' : `Rédige ton post du ${formatLongDay(date)}`;
}

// ---------------------------------------------------------------------------
// Activité récente
// ---------------------------------------------------------------------------

export type ActivityKind = 'audit' | 'strategy' | 'plan' | 'post' | 'contact' | 'credits';
export type Activity = { kind: ActivityKind; at: string; text: string; to: string };

const CREDIT_REASONS: Partial<Record<DashCredit['reason'], string>> = {
  purchase: 'Recharge',
  signup_grant: 'Crédits offerts',
  manual_adjust: 'Crédits ajoutés par l’équipe',
  refund: 'Remboursement',
};

export function buildActivity(d: DashboardData, limit = 7): Activity[] {
  const items: Activity[] = [
    ...d.audits.map((a) => ({
      kind: 'audit' as const,
      at: a.createdAt,
      text: `Audit réalisé · score ${a.score}/100`,
      to: '/audit',
    })),
    ...(d.pillars.createdAt
      ? [
          {
            kind: 'strategy' as const,
            at: d.pillars.createdAt,
            text: `Stratégie de contenu · ${d.pillars.count} piliers`,
            to: '/strategie',
          },
        ]
      : []),
    ...(d.plan
      ? [
          {
            kind: 'plan' as const,
            at: d.plan.createdAt,
            text: `Plan éditorial sur ${d.plan.horizon} jours créé`,
            to: '/plan',
          },
        ]
      : []),
    ...d.posts.map((p) => ({
      kind: 'post' as const,
      at: p.createdAt,
      text: `${p.status === 'published' ? 'Post publié' : 'Post rédigé'} : ${p.firstLine || 'sans titre'}`,
      to: `/studio?post=${p.id}`,
    })),
    ...d.contacts.map((c) => ({
      kind: 'contact' as const,
      at: c.createdAt,
      text: `Messages écrits pour ${c.fullName}`,
      to: '/reseau?onglet=suivi',
    })),
    ...d.credits
      .filter((c) => c.delta > 0)
      .map((c) => ({
        kind: 'credits' as const,
        at: c.createdAt,
        text: `${CREDIT_REASONS[c.reason] ?? 'Crédits'} · +${c.delta} crédits`,
        to: '/compte',
      })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

const relative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

/** « il y a 2 heures », « hier », « il y a 3 jours »… */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return 'à l’instant';
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 30 * 86_400) return relative.format(Math.round(seconds / 86_400), 'day');
  return relative.format(Math.round(seconds / (30 * 86_400)), 'month');
}
