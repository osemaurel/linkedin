import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';

export const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
export const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
export const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export type AuthContext = { userId: string; authHeader: string };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** POST authentifié : CORS, vérification du jeton, erreurs renvoyées en { error: code }. */
export function serve(handler: (req: Request, auth: AuthContext) => Promise<unknown>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    try {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      if (!token) throw new HttpError(401, 'unauthorized');
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) throw new HttpError(401, 'unauthorized');
      return json(200, await handler(req, { userId: data.user.id, authHeader }));
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.code });
      console.error('erreur inattendue', err);
      return json(500, { error: 'internal' });
    }
  });
}
