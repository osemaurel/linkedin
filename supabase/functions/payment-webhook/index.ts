import { HttpError, json } from '../_shared/http.ts';
import {
  reconcilePendingPayments,
  verifyWebhookSignature,
  webhookSecret,
  type WebhookHint,
} from '../_shared/saspay.ts';

type WebhookBody = {
  event?: unknown;
  data?: { amount?: unknown; currency?: unknown; metadata?: { payment_id?: unknown } };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hintFrom(body: WebhookBody): WebhookHint {
  const data = body.data ?? {};
  const paymentId = data.metadata?.payment_id;
  const amount = typeof data.amount === 'string' ? Number(data.amount) : NaN;
  return {
    paymentId: typeof paymentId === 'string' && UUID.test(paymentId) ? paymentId : undefined,
    amount: Number.isFinite(amount) ? amount : undefined,
    currency: typeof data.currency === 'string' ? data.currency : undefined,
  };
}

/**
 * Webhook SasPay, appelé sans jeton utilisateur (verify_jwt = false) : la signature
 * HMAC est la seule preuve d'origine. Un webhook rejoué ne crédite jamais deux fois.
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  try {
    const secret = webhookSecret();
    const raw = new Uint8Array(await req.arrayBuffer());
    const valid = await verifyWebhookSignature(
      raw,
      req.headers.get('X-Webhook-Signature'),
      req.headers.get('X-Webhook-Timestamp'),
      secret,
    );
    if (!valid) throw new HttpError(401, 'invalid_signature');

    let body: WebhookBody;
    try {
      body = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      throw new HttpError(400, 'bad_request');
    }
    const event = typeof body.event === 'string' ? body.event : req.headers.get('X-Webhook-Event');

    // Seuls les événements de transaction concernent les paiements ; le reste est acquitté.
    if (!event?.startsWith('transaction.')) return json(200, { ok: true, ignored: event });

    const result = await reconcilePendingPayments(hintFrom(body));
    console.log(`webhook ${event} : ${result.succeeded} payé(s), ${result.failed} échoué(s)`);
    return json(200, { ok: true, ...result });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.code });
    // Erreur de vérification : réponse non 2xx, SasPay rejouera le webhook plus tard.
    console.error('webhook : erreur', err);
    return json(502, { error: 'verification_failed' });
  }
});
