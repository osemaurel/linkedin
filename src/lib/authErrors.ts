import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

export const ACCOUNT_EXISTS_MESSAGE = 'Un compte existe déjà avec cette adresse. Connecte-toi.';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed:
    'Ton adresse email n’est pas encore confirmée. Clique sur le lien reçu par email.',
  user_already_exists: ACCOUNT_EXISTS_MESSAGE,
  email_exists: ACCOUNT_EXISTS_MESSAGE,
  weak_password: 'Mot de passe trop faible. Choisis-en un plus long et plus varié.',
  email_address_invalid: 'Cette adresse email n’est pas valide.',
  email_address_not_authorized:
    'Impossible d’envoyer l’email de confirmation à cette adresse pour le moment.',
  over_email_send_rate_limit: 'Trop de demandes. Réessaie dans quelques minutes.',
  over_request_rate_limit: 'Trop de tentatives. Réessaie dans quelques minutes.',
  signup_disabled: 'Les inscriptions sont fermées pour le moment.',
};

export function authErrorMessage(error: unknown): string {
  if (isAuthRetryableFetchError(error)) {
    return 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.';
  }
  if (isAuthError(error) && error.code && MESSAGES[error.code]) {
    return MESSAGES[error.code];
  }
  return 'Une erreur est survenue. Réessaie dans un instant.';
}
