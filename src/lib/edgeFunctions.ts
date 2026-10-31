import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export class FunctionError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Appelle une Edge Function et traduit son code d'erreur en message pour l'utilisateur. */
export async function invokeFunction<T>(
  name: string,
  body: Record<string, unknown>,
  messages: Record<string, string>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error || !data) {
    let code: string | undefined;
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      code = payload?.error;
    }
    throw new FunctionError(
      (code && messages[code]) ?? 'Une erreur est survenue. Vérifie ta connexion et réessaie.',
      code,
    );
  }
  return data;
}
