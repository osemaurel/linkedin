import { invokeFunction } from './edgeFunctions';

const MESSAGES: Record<string, string> = {
  forbidden: 'Accès réservé aux administrateurs.',
  bad_amount: 'Montant invalide : un nombre entier non nul, 10 000 au plus.',
  reason_required: 'Indique un motif (3 à 200 caractères).',
  negative_balance: 'Ce retrait rendrait le solde négatif.',
  self_change: 'Tu ne peux pas modifier tes propres droits d’administrateur.',
  user_not_found: 'Utilisateur introuvable.',
  payment_not_found: 'Paiement introuvable.',
  not_pending: 'Ce paiement n’est plus en attente.',
  payment_not_configured: 'SasPay n’est pas encore configuré (clés manquantes).',
  payment_provider_failed: 'SasPay ne répond pas pour le moment. Réessaie plus tard.',
};

/** Toutes les données d'administration passent par la fonction admin, qui vérifie le droit. */
export function adminCall<T>(action: string, params: Record<string, unknown> = {}) {
  return invokeFunction<T>('admin', { action, ...params }, MESSAGES);
}

export type Person = { email: string; full_name: string | null };
export type People = Record<string, Person>;

export type DailyPoint = { day: string; signups: number; generations: number };
export type OverviewStats = {
  users_total: number;
  users_7d: number;
  users_30d: number;
  active_7d: number;
  revenue_total: number;
  revenue_30d: number;
  payments_pending: number;
  credits_sold_30d: number;
  credits_granted_30d: number;
  credits_consumed_30d: number;
  credits_outstanding: number;
  generations_7d: number;
  generations_failed_7d: number;
  daily: DailyPoint[];
};
export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  country: string | null;
  objective: string | null;
  credits_balance: number;
  created_at: string;
  last_sign_in_at: string | null;
  last_activity_at: string | null;
  is_admin: boolean;
};
export type AdminPayment = {
  id: string;
  user_id: string;
  provider?: string;
  provider_ref?: string;
  amount: number;
  currency: string;
  credits: number;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: string;
  completed_at?: string | null;
};
export type AdminGeneration = {
  id: string;
  user_id?: string;
  kind: string;
  status: 'pending' | 'success' | 'failed';
  cost_credits?: number;
  tokens_in?: number | null;
  tokens_out?: number | null;
  error: string | null;
  created_at: string;
  completed_at?: string | null;
};
export type GenerationStat = {
  kind: string;
  total: number;
  failed: number;
  credits: number;
  tokens_in: number;
  tokens_out: number;
  avg_seconds: number | null;
};
export type AuditEntry = {
  id: string;
  admin_id: string | null;
  action: string;
  target_user: string | null;
  details: Record<string, unknown>;
  created_at: string;
};
export type Paged = { total: number; page: number; page_size: number };

export type Overview = {
  stats: OverviewStats;
  recent_users: AdminUserRow[];
  recent_payments: AdminPayment[];
  recent_failures: AdminGeneration[];
  people: People;
};

export type UserDetail = {
  auth: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
  };
  profile: {
    full_name: string | null;
    country: string | null;
    objective: string | null;
    credits_balance: number;
  } | null;
  strategic: {
    headline: string | null;
    positioning: string | null;
    target_audience: string | null;
    source: string | null;
  } | null;
  is_admin: boolean;
  counts: { audits: number; posts: number; contacts: number; generations: number };
  latest_score: number | null;
  credits: {
    id: string;
    delta: number;
    reason: string;
    balance_after: number;
    created_at: string;
  }[];
  payments: AdminPayment[];
  generations: AdminGeneration[];
};

// ---------------------------------------------------------------------------
// Libellés
// ---------------------------------------------------------------------------

export const KIND_LABELS: Record<string, string> = {
  audit: 'Audit',
  block_rewrite: 'Réponse à une question',
  profile_parse: 'Lecture du profil',
  profile_full: 'Profil complet',
  pillars: 'Stratégie',
  content_plan: 'Plan éditorial',
  plan_slot: 'Nouvel angle',
  post: 'Post',
  post_refine: 'Retouche',
  voice_profile: 'Voix',
  targeting: 'Ciblage',
  outreach_message: 'Messages d’approche',
  carousel: 'Carrousel',
  image: 'Image',
};
export const kindLabel = (kind: string) => KIND_LABELS[kind] ?? kind;

export const REASON_LABELS: Record<string, string> = {
  signup_grant: 'Crédits offerts',
  purchase: 'Recharge',
  generation_debit: 'Utilisation',
  refund: 'Remboursement',
  manual_adjust: 'Ajustement',
};

export const PAYMENT_STATUS: Record<AdminPayment['status'], { label: string; tone: string }> = {
  pending: { label: 'En attente', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  succeeded: { label: 'Réussi', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  failed: { label: 'Échoué', tone: 'bg-red-50 text-red-700 ring-red-200' },
  refunded: { label: 'Remboursé', tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export const GENERATION_STATUS: Record<AdminGeneration['status'], { label: string; tone: string }> =
  {
    pending: { label: 'En cours', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
    success: { label: 'Réussie', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
    failed: { label: 'Échouée', tone: 'bg-red-50 text-red-700 ring-red-200' },
  };

export const AUDIT_ACTIONS: Record<string, string> = {
  adjust_credits: 'Ajustement de crédits',
  grant_admin: 'Droit d’administrateur accordé',
  revoke_admin: 'Droit d’administrateur retiré',
  recheck_payment: 'Paiement revérifié',
};

export const OBJECTIVE_LABELS: Record<string, string> = {
  job: 'Décrocher un poste',
  clients: 'Trouver des clients',
  visibility: 'Développer sa visibilité',
};

const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const numbers = new Intl.NumberFormat('fr-FR');

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? dateTime.format(new Date(iso)) : '—';
export const fmtDate = (iso: string | null | undefined) =>
  iso ? dateOnly.format(new Date(iso)) : '—';
export const fmtNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : numbers.format(n);

export function duration(from: string, to: string | null | undefined): string {
  if (!to) return '—';
  const s = (Date.parse(to) - Date.parse(from)) / 1000;
  return s < 60 ? `${s.toFixed(1).replace('.', ',')} s` : `${Math.round(s / 60)} min`;
}

export const personLabel = (people: People, id: string | null | undefined) =>
  (id && (people[id]?.full_name || people[id]?.email)) || 'Utilisateur supprimé';
