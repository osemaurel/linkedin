import { invokeFunction } from './edgeFunctions';

const MESSAGES: Record<string, string> = {
  payment_not_configured: 'Le paiement est momentanément indisponible. Réessaie un peu plus tard.',
  payment_provider_failed: 'SasPay ne répond pas pour le moment. Réessaie dans un instant.',
  too_many_pending:
    'Tu as déjà plusieurs paiements en cours. Termine-les ou réessaie dans une demi-heure.',
  unknown_pack: 'Ce pack n’existe plus. Recharge la page.',
};

/** Ouvre une session de paiement SasPay pour un pack ; le prix est fixé côté serveur. */
export function createPayment(packId: string) {
  return invokeFunction<{ payment_id: string; checkout_url: string }>(
    'create-payment',
    { pack_id: packId },
    MESSAGES,
  );
}
