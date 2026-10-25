import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type ParseProfileRequest =
  | { source: 'pdf'; path: string }
  | { source: 'paste'; headline: string; about: string; experiences: string };

export type ParseProfileResult = { headline: string | null; experiences: number };

const MESSAGES: Record<string, string> = {
  pdf_unreadable:
    'Ce fichier n’a pas pu être lu. Vérifie que c’est bien le PDF exporté depuis LinkedIn.',
  pdf_no_text:
    'Ce PDF ne contient pas de texte lisible, c’est peut-être une image scannée. Utilise l’export « Enregistrer au format PDF » de LinkedIn, ou colle ton profil.',
  pdf_too_large: 'Ce PDF dépasse 5 Mo. L’export LinkedIn fait en général moins de 1 Mo.',
  pdf_not_found: 'Le PDF n’a pas été retrouvé. Envoie-le à nouveau.',
  too_long: 'Le texte est trop long. Garde seulement les sections de ton profil.',
  empty_paste: 'Colle au moins une section de ton profil.',
  llm_not_configured:
    'La lecture automatique est momentanément indisponible. Réessaie un peu plus tard.',
  llm_failed: 'La lecture de ton profil a échoué. Réessaie dans un instant.',
};

export async function parseProfile(body: ParseProfileRequest): Promise<ParseProfileResult> {
  const { data, error } = await supabase.functions.invoke<ParseProfileResult>('parse-profile', {
    body,
  });
  if (error || !data) {
    let code: string | undefined;
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      code = payload?.error;
    }
    throw new Error(
      (code && MESSAGES[code]) ?? 'Une erreur est survenue. Vérifie ta connexion et réessaie.',
    );
  }
  return data;
}
