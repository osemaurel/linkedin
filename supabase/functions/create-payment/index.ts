import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import { PACKS } from '../_shared/pricing.ts';
import {
  cancelCheckout,
  countryCode,
  createCheckout,
  returnUrl,
  SasPayError,
} from '../_shared/saspay.ts';

/** Au-delà, l'utilisateur a déjà des paiements ouverts : il les termine ou attend. */
const MAX_PENDING_PER_WINDOW = 5;
const PENDING_WINDOW_MINUTES = 30;

async function ensureNotFlooding(userId: string) {
  const since = new Date(Date.now() - PENDING_WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('created_at', since);
  if (error) throw error;
  if ((count ?? 0) >= MAX_PENDING_PER_WINDOW) throw new HttpError(429, 'too_many_pending');
}

serve(async (req, { userId, email }) => {
  const body = await readJson(req);
  // Le prix vient du serveur : le client n'envoie que l'identifiant du pack.
  const pack = PACKS.find((p) => p.id === body.pack_id);
  if (!pack) throw new HttpError(400, 'unknown_pack');
  if (!email) throw new HttpError(409, 'email_missing');
  await ensureNotFlooding(userId);

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('full_name, country')
    .eq('id', userId)
    .single();
  if (profileError) throw profileError;

  const paymentId = crypto.randomUUID();
  let session: { id: string; checkout_url: string };
  try {
    session = await createCheckout({
      amount: pack.price.toFixed(2),
      currency: pack.currency,
      description: `Pack ${pack.name} : ${pack.credits} crédits`,
      customer_email: email,
      customer_name: profile.full_name?.trim() || email.split('@')[0],
      country: countryCode(profile.country),
      return_url: returnUrl(req, paymentId),
      metadata: { payment_id: paymentId },
    });
  } catch (err) {
    if (err instanceof SasPayError) throw new HttpError(502, 'payment_provider_failed');
    throw err;
  }

  // Ligne en attente, référencée par l'identifiant de session SasPay : la contrainte
  // unique (provider, provider_ref) garantit un seul paiement par session.
  const { error } = await admin.from('payments').insert({
    id: paymentId,
    user_id: userId,
    provider: 'saspay',
    provider_ref: session.id,
    amount: pack.price,
    currency: pack.currency,
    credits: pack.credits,
    status: 'pending',
  });
  if (error) {
    // Sans ligne en base, la session ne doit pas pouvoir être payée. Sauf si la référence
    // existe déjà (contrainte unique) : la session appartient alors à un autre paiement.
    if (error.code !== '23505') {
      await cancelCheckout(session.id).catch((e) => console.error('annulation SasPay', e));
    }
    throw error;
  }

  return { payment_id: paymentId, checkout_url: session.checkout_url };
});
