import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import { checkoutStatus, SasPayError, settlePayment } from '../_shared/saspay.ts';

/**
 * Centre de contrôle. Une seule porte d'entrée pour toutes les données d'administration :
 * le droit d'administrateur est vérifié à chaque appel, avant toute lecture ou action,
 * et chaque action qui modifie quelque chose est inscrite au journal.
 */

const PAGE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ADJUST = 10_000;

type Body = Record<string, unknown>;

function uuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw new HttpError(400, 'bad_request');
  return value;
}

function page(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isInteger(n) && n >= 0 && n < 10_000 ? n : 0;
}

/** Résultat qui doit exister (liste, insertion, appel de fonction). */
function must<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error;
  if (r.data === null) throw new Error('réponse vide');
  return r.data;
}

/** Résultat qui peut manquer (maybeSingle). */
function maybe<T>(r: { data: T | null; error: unknown }): T | null {
  if (r.error) throw r.error;
  return r.data;
}

/** Erreurs levées par les fonctions SQL d'administration, traduites en réponses HTTP. */
const RPC_ERRORS: Record<string, number> = {
  bad_amount: 400,
  reason_required: 400,
  user_not_found: 404,
  negative_balance: 409,
  self_change: 409,
};

function rpcError(error: { message?: string }) {
  const code = error.message ?? '';
  return Object.hasOwn(RPC_ERRORS, code) ? new HttpError(RPC_ERRORS[code], code) : error;
}

async function ensureAdmin(userId: string) {
  const { data, error } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(403, 'forbidden');
}

async function log(adminId: string, action: string, target: string | null, details: Body) {
  const { data, error } = await admin
    .from('admin_audit_log')
    .insert({ admin_id: adminId, action, target_user: target, details })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

/** E-mail et nom des utilisateurs cités dans une page de résultats. */
async function people(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((i): i is string => Boolean(i)))];
  if (!unique.length) return {} as Record<string, { email: string; full_name: string | null }>;
  const rows = must(await admin.rpc('admin_user_emails', { p_ids: unique })) as {
    id: string;
    email: string;
    full_name: string | null;
  }[];
  return Object.fromEntries(rows.map((r) => [r.id, { email: r.email, full_name: r.full_name }]));
}

const actions: Record<string, (body: Body, adminId: string) => Promise<unknown>> = {
  async overview() {
    const [overview, signups, payments, failures] = await Promise.all([
      admin.rpc('admin_overview', { p_days: 30 }),
      admin.rpc('admin_list_users', { p_search: null, p_limit: 5, p_offset: 0 }),
      admin
        .from('payments')
        .select('id, user_id, amount, currency, credits, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      admin
        .from('generations')
        .select('id, user_id, kind, error, created_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    const pay = must(payments);
    const fail = must(failures);
    return {
      stats: must(overview),
      recent_users: must(signups),
      recent_payments: pay,
      recent_failures: fail,
      people: await people([...pay.map((p) => p.user_id), ...fail.map((f) => f.user_id)]),
    };
  },

  async users(body) {
    const search = typeof body.search === 'string' ? body.search.trim().slice(0, 100) : '';
    const p = page(body.page);
    const rows = must(
      await admin.rpc('admin_list_users', {
        p_search: search || null,
        p_limit: PAGE,
        p_offset: p * PAGE,
      }),
    ) as { total_count: number }[];
    return { users: rows, total: rows[0]?.total_count ?? 0, page: p, page_size: PAGE };
  },

  async user(body) {
    const id = uuid(body.user_id);
    const authRows = must(await admin.rpc('admin_user_auth', { p_id: id })) as unknown[];
    if (!authRows.length) throw new HttpError(404, 'user_not_found');
    const count = (table: string) =>
      admin.from(table).select('id', { count: 'exact', head: true }).eq('user_id', id);
    const [
      profile,
      strategic,
      isAdmin,
      audits,
      posts,
      contacts,
      generationsCount,
      credits,
      payments,
      generations,
    ] = await Promise.all([
      admin
        .from('profiles')
        .select('full_name, country, objective, credits_balance')
        .eq('id', id)
        .maybeSingle(),
      admin
        .from('strategic_profiles')
        .select('headline, positioning, target_audience, raw_source')
        .eq('user_id', id)
        .maybeSingle(),
      admin.from('admin_users').select('user_id').eq('user_id', id).maybeSingle(),
      admin
        .from('audits')
        .select('score_global, created_at', { count: 'exact' })
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1),
      count('posts'),
      count('contacts'),
      count('generations'),
      admin
        .from('credit_transactions')
        .select('id, delta, reason, balance_after, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      admin
        .from('payments')
        .select('id, amount, currency, credits, status, provider, provider_ref, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
      admin
        .from('generations')
        .select(
          'id, kind, status, cost_credits, tokens_in, tokens_out, error, created_at, completed_at',
        )
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    const s = maybe(strategic);
    const latestAudit = must(audits)[0] ?? null;
    return {
      auth: authRows[0],
      profile: maybe(profile),
      strategic: s
        ? {
            headline: s.headline,
            positioning: s.positioning,
            target_audience: s.target_audience,
            source: (s.raw_source as { source?: string } | null)?.source ?? null,
          }
        : null,
      is_admin: Boolean(maybe(isAdmin)),
      counts: {
        audits: audits.count ?? 0,
        posts: posts.count ?? 0,
        contacts: contacts.count ?? 0,
        generations: generationsCount.count ?? 0,
      },
      latest_score: latestAudit?.score_global ?? null,
      credits: must(credits),
      payments: must(payments),
      generations: must(generations),
    };
  },

  async adjust_credits(body, adminId) {
    const id = uuid(body.user_id);
    const delta = Number(body.delta);
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_ADJUST) {
      throw new HttpError(400, 'bad_amount');
    }
    if (reason.length < 3 || reason.length > 200) throw new HttpError(400, 'reason_required');
    // Le mouvement et son entrée au journal (motif, auteur, solde avant) sont écrits
    // dans la même transaction, avec un verrou sur le solde.
    const { data, error } = await admin.rpc('admin_adjust_credits', {
      p_admin: adminId,
      p_user: id,
      p_delta: delta,
      p_reason: reason,
    });
    if (error) throw rpcError(error);
    return { balance: data as number };
  },

  async set_admin(body, adminId) {
    const id = uuid(body.user_id);
    const grant = body.admin === true;
    if (id === adminId) throw new HttpError(409, 'self_change');
    const { error } = await admin.rpc('admin_set_admin', {
      p_admin: adminId,
      p_user: id,
      p_grant: grant,
    });
    if (error) throw rpcError(error);
    return { is_admin: grant };
  },

  async payments(body) {
    const p = page(body.page);
    let query = admin
      .from('payments')
      .select(
        'id, user_id, provider, provider_ref, amount, currency, credits, status, created_at, completed_at',
        {
          count: 'exact',
        },
      )
      .order('created_at', { ascending: false })
      .range(p * PAGE, p * PAGE + PAGE - 1);
    if (['pending', 'succeeded', 'failed', 'refunded'].includes(body.status as string)) {
      query = query.eq('status', body.status as 'pending');
    }
    const result = await query;
    const rows = must(result);
    return {
      payments: rows,
      total: result.count ?? 0,
      page: p,
      page_size: PAGE,
      people: await people(rows.map((r) => r.user_id)),
    };
  },

  async recheck_payment(body, adminId) {
    const id = uuid(body.payment_id);
    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .select('id, user_id, provider, provider_ref, status')
      .eq('id', id)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) throw new HttpError(404, 'payment_not_found');
    if (payment.provider !== 'saspay' || payment.status !== 'pending') {
      throw new HttpError(409, 'not_pending');
    }
    let session;
    try {
      session = await checkoutStatus(payment.provider_ref);
    } catch (err) {
      if (err instanceof SasPayError) throw new HttpError(502, 'payment_provider_failed');
      throw err;
    }
    const next =
      session?.status === 'PAID'
        ? 'succeeded'
        : session?.status === 'EXPIRED' || session?.status === 'CANCELLED'
          ? 'failed'
          : null;
    const changed = next ? await settlePayment(id, next) : false;
    await log(adminId, 'recheck_payment', payment.user_id, {
      payment_id: id,
      provider_status: session?.status ?? 'introuvable',
      result: changed ? next : 'inchangé',
    });
    return { status: changed ? next : 'pending', provider_status: session?.status ?? null };
  },

  async generations(body) {
    const p = page(body.page);
    let query = admin
      .from('generations')
      .select(
        'id, user_id, kind, status, cost_credits, tokens_in, tokens_out, error, created_at, completed_at',
        {
          count: 'exact',
        },
      )
      .order('created_at', { ascending: false })
      .range(p * PAGE, p * PAGE + PAGE - 1);
    if (['pending', 'success', 'failed'].includes(body.status as string)) {
      query = query.eq('status', body.status as 'pending');
    }
    if (typeof body.kind === 'string' && /^[a-z_]{2,40}$/.test(body.kind)) {
      query = query.eq('kind', body.kind as 'audit');
    }
    const [result, stats] = await Promise.all([
      query,
      admin.rpc('admin_generation_stats', { p_days: 30 }),
    ]);
    const rows = must(result);
    return {
      generations: rows,
      total: result.count ?? 0,
      page: p,
      page_size: PAGE,
      stats: must(stats),
      people: await people(rows.map((r) => r.user_id)),
    };
  },

  async audit_log(body) {
    const p = page(body.page);
    const result = await admin
      .from('admin_audit_log')
      .select('id, admin_id, action, target_user, details, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * PAGE, p * PAGE + PAGE - 1);
    const rows = must(result);
    return {
      entries: rows,
      total: result.count ?? 0,
      page: p,
      page_size: PAGE,
      people: await people(rows.flatMap((r) => [r.admin_id, r.target_user])),
    };
  },
};

serve(async (req, { userId }) => {
  await ensureAdmin(userId);
  const body = await readJson(req);
  const action = typeof body.action === 'string' ? actions[body.action] : undefined;
  if (!action || !Object.hasOwn(actions, body.action as string)) {
    throw new HttpError(400, 'unknown_action');
  }
  return action(body, userId);
});
