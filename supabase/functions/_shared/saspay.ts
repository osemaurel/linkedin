import { admin, HttpError } from './http.ts';

/**
 * SasPay (https://docs.saspay.me) : page de paiement hébergée (checkout) et webhooks signés.
 * La clé secrète (sk_test_… ou sk_live_…) choisit le mode ; l'URL de l'API est la même.
 */
const API_URL = Deno.env.get('SASPAY_API_URL') ?? 'https://api.saspay.me/api/v1';
/** Écart toléré entre X-Webhook-Timestamp et notre horloge (recommandation SasPay). */
const WEBHOOK_TOLERANCE_SECONDS = 300;

export class SasPayError extends Error {
  constructor(readonly status: number) {
    super(`SasPay a répondu ${status}`);
  }
}

function secretKey(): string {
  const key = Deno.env.get('SASPAY_SECRET_KEY');
  if (!key) throw new HttpError(503, 'payment_not_configured');
  return key;
}

export function webhookSecret(): string {
  const secret = Deno.env.get('SASPAY_WEBHOOK_SECRET');
  if (!secret) throw new HttpError(503, 'payment_not_configured');
  return secret;
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`SasPay ${method} ${path} : ${res.status}`, text.slice(0, 500));
    throw new SasPayError(res.status);
  }
  const payload = text ? JSON.parse(text) : null;
  // Réponse documentée dans une enveloppe { success, data, code } ; on accepte aussi l'objet nu.
  return (
    payload && typeof payload === 'object' && 'success' in payload && 'data' in payload
      ? payload.data
      : payload
  ) as T;
}

export type CheckoutInput = {
  amount: string;
  currency: string;
  description: string;
  customer_email: string;
  customer_name: string;
  country?: string;
  return_url: string;
  metadata: Record<string, string>;
};

export async function createCheckout(
  input: CheckoutInput,
): Promise<{ id: string; checkout_url: string }> {
  const session = await call<{ id?: unknown; checkout_url?: unknown }>(
    'POST',
    '/checkout-sessions/',
    input,
  );
  if (typeof session?.id !== 'string' || typeof session.checkout_url !== 'string') {
    console.error('SasPay : session de paiement inattendue', session);
    throw new SasPayError(502);
  }
  return { id: session.id, checkout_url: session.checkout_url };
}

export async function cancelCheckout(id: string): Promise<void> {
  await call('POST', `/checkout-sessions/${encodeURIComponent(id)}/cancel/`, {});
}

type CheckoutStatus = { status?: string; transaction_id?: string | null };

/** Statut de la session, revérifié par SasPay auprès de l'opérateur ; null si inconnue. */
async function checkoutStatus(id: string): Promise<CheckoutStatus | null> {
  try {
    return await call<CheckoutStatus>(
      'GET',
      `/checkout-sessions/${encodeURIComponent(id)}/status/`,
    );
  } catch (err) {
    if (err instanceof SasPayError && err.status === 404) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Signature des webhooks : HMAC-SHA256 hexadécimal de `${timestamp}.${corps brut}`,
// clé = signing_secret du webhook (affiché une seule fois dans le tableau de bord SasPay).
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  return Uint8Array.from(hex.match(/../g)!, (b) => parseInt(b, 16));
}

export async function verifyWebhookSignature(
  rawBody: Uint8Array<ArrayBuffer>,
  signature: string | null,
  timestamp: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !timestamp || !/^\d{1,12}$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > WEBHOOK_TOLERANCE_SECONDS) return false;
  const expected = hexToBytes(signature.trim());
  if (!expected) return false;

  const prefix = encoder.encode(`${timestamp}.`);
  const signed = new Uint8Array(prefix.length + rawBody.length);
  signed.set(prefix);
  signed.set(rawBody, prefix.length);

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  // verify compare en temps constant.
  return crypto.subtle.verify('HMAC', key, expected, signed);
}

// ---------------------------------------------------------------------------
// Rapprochement : un webhook signale qu'une transaction a changé, mais ne porte pas
// l'identifiant de la session. On revérifie donc auprès de SasPay les paiements en
// attente concernés, et seule la réponse de l'API fait passer un paiement à succeeded.
// ---------------------------------------------------------------------------

const RECENT_HOURS = 48;
const MAX_CHECKS = 25;

/**
 * Seul un paiement encore `pending` change d'état : un webhook rejoué, même en parallèle,
 * ne trouve plus rien à mettre à jour. Le passage à `succeeded` déclenche le trigger
 * payments_credit_on_success, qui crédite le compte une seule fois.
 */
export async function settlePayment(
  paymentId: string,
  status: 'succeeded' | 'failed',
): Promise<boolean> {
  const { data, error } = await admin
    .from('payments')
    .update({ status, completed_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('status', 'pending')
    .select('id');
  if (error) throw error;
  return data.length > 0;
}

export type WebhookHint = { paymentId?: string; amount?: number; currency?: string };

export async function reconcilePendingPayments(
  hint: WebhookHint,
): Promise<{ succeeded: number; failed: number }> {
  const since = new Date(Date.now() - RECENT_HOURS * 3600_000).toISOString();
  const query = () =>
    admin
      .from('payments')
      .select('id, provider_ref')
      .eq('provider', 'saspay')
      .eq('status', 'pending')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX_CHECKS);

  // Du plus précis au plus large : identifiant renvoyé dans metadata, puis montant, puis tout.
  let candidates: { id: string; provider_ref: string }[] = [];
  if (hint.paymentId) {
    const { data, error } = await query().eq('id', hint.paymentId);
    if (error) throw error;
    candidates = data;
  }
  if (!candidates.length && hint.amount !== undefined && hint.currency) {
    const { data, error } = await query().eq('amount', hint.amount).eq('currency', hint.currency);
    if (error) throw error;
    candidates = data;
  }
  if (!candidates.length) {
    const { data, error } = await query();
    if (error) throw error;
    candidates = data;
  }

  const results = await Promise.allSettled(
    candidates.map(async (payment) => {
      const session = await checkoutStatus(payment.provider_ref);
      const next =
        session?.status === 'PAID'
          ? 'succeeded'
          : session?.status === 'EXPIRED' || session?.status === 'CANCELLED'
            ? 'failed'
            : null;
      return next && (await settlePayment(payment.id, next)) ? next : null;
    }),
  );
  const failure = results.find((r) => r.status === 'rejected');
  // Une vérification impossible renvoie une erreur : SasPay rejouera le webhook.
  if (failure) throw (failure as PromiseRejectedResult).reason;
  const settled = results.map((r) => (r as PromiseFulfilledResult<string | null>).value);
  return {
    succeeded: settled.filter((s) => s === 'succeeded').length,
    failed: settled.filter((s) => s === 'failed').length,
  };
}

// ---------------------------------------------------------------------------
// Utilitaires de create-payment
// ---------------------------------------------------------------------------

const COUNTRY_CODES: Record<string, string> = {
  benin: 'BJ',
  'burkina faso': 'BF',
  "cote d'ivoire": 'CI',
  mali: 'ML',
  niger: 'NE',
  senegal: 'SN',
  togo: 'TG',
};

/** Pays saisi en toutes lettres → code ISO attendu par SasPay (zone XOF uniquement). */
export function countryCode(country: string | null): string | undefined {
  if (!country) return undefined;
  const key = country
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .trim()
    .toLowerCase();
  return COUNTRY_CODES[key];
}

const APP_URL = Deno.env.get('APP_URL') ?? 'https://linkedin-one-brown.vercel.app';
const ALLOWED_ORIGINS = [
  /^https:\/\/linkedin-one-brown\.vercel\.app$/,
  /^https:\/\/linkedin-[a-z0-9-]+-osecapoch-gmailcoms-projects\.vercel\.app$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];

/** Page de retour sur le site d'où vient la demande, s'il est connu ; sinon la production. */
export function returnUrl(req: Request, paymentId: string): string {
  const origin = req.headers.get('origin');
  const base =
    origin && (origin === APP_URL || ALLOWED_ORIGINS.some((re) => re.test(origin)))
      ? origin
      : APP_URL;
  return `${base}/paiement/${paymentId}`;
}
