-- Centre de contrôle (/admin)
-- Les droits d'administration vivent dans admin_users, sans aucune policy : ni lecture
-- ni écriture côté client. Toutes les données d'administration passent par l'Edge
-- Function admin, qui vérifie le droit à chaque appel avec le service_role.

create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table admin_users enable row level security;

-- Journal des actions d'administration (ajustements de crédits, droits, paiements).
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_user uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_admin_audit_log_created on admin_audit_log (created_at desc);
alter table admin_audit_log enable row level security;

revoke all on admin_users, admin_audit_log from anon, authenticated;

-- L'interface demande seulement « suis-je administrateur ? » : rien d'autre ne fuit.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Fonctions de lecture réservées au service_role (appelées par l'Edge Function)
-- ---------------------------------------------------------------------------

create or replace function public.admin_overview(p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select generate_series(
      (current_date - (p_days - 1)), current_date, interval '1 day'
    )::date as day
  )
  select jsonb_build_object(
    'users_total', (select count(*) from auth.users),
    'users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_30d', (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'active_7d', (
      select count(distinct user_id) from generations
      where created_at > now() - interval '7 days'
    ),
    'revenue_total', (select coalesce(sum(amount), 0) from payments where status = 'succeeded'),
    'revenue_30d', (
      select coalesce(sum(amount), 0) from payments
      where status = 'succeeded' and created_at > now() - interval '30 days'
    ),
    'payments_pending', (select count(*) from payments where status = 'pending'),
    'credits_sold_30d', (
      select coalesce(sum(credits), 0) from payments
      where status = 'succeeded' and created_at > now() - interval '30 days'
    ),
    'credits_granted_30d', (
      select coalesce(sum(delta), 0) from credit_transactions
      where reason in ('manual_adjust', 'signup_grant', 'refund') and delta > 0
        and created_at > now() - interval '30 days'
    ),
    'credits_consumed_30d', (
      select coalesce(-sum(delta), 0) from credit_transactions
      where reason = 'generation_debit' and created_at > now() - interval '30 days'
    ),
    'credits_outstanding', (select coalesce(sum(credits_balance), 0) from profiles),
    'generations_7d', (
      select count(*) from generations where created_at > now() - interval '7 days'
    ),
    'generations_failed_7d', (
      select count(*) from generations
      where status = 'failed' and created_at > now() - interval '7 days'
    ),
    'daily', (
      select jsonb_agg(
        jsonb_build_object(
          'day', d.day,
          'signups', (select count(*) from auth.users u where u.created_at::date = d.day),
          'generations', (
            select count(*) from generations g
            where g.created_at::date = d.day and g.status = 'success'
          )
        )
        order by d.day
      )
      from days d
    )
  );
$$;

create or replace function public.admin_list_users(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  email text,
  full_name text,
  country text,
  objective text,
  credits_balance integer,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz,
  is_admin boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select u.id, u.email::text as email, p.full_name, p.country, p.objective::text as objective,
           coalesce(p.credits_balance, 0) as credits_balance, u.created_at, u.last_sign_in_at,
           (select max(g.created_at) from generations g where g.user_id = u.id) as last_activity_at,
           exists (select 1 from admin_users a where a.user_id = u.id) as is_admin
    from auth.users u
    left join profiles p on p.id = u.id
    where p_search is null or p_search = ''
       or u.email ilike '%' || p_search || '%'
       or p.full_name ilike '%' || p_search || '%'
  )
  select f.*, count(*) over () as total_count
  from filtered f
  order by f.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

create or replace function public.admin_user_emails(p_ids uuid[])
returns table (id uuid, email text, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email::text, p.full_name
  from auth.users u
  left join profiles p on p.id = u.id
  where u.id = any (p_ids);
$$;

create or replace function public.admin_user_auth(p_id uuid)
returns table (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
               email_confirmed_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at
  from auth.users u
  where u.id = p_id;
$$;

create or replace function public.admin_generation_stats(p_days integer default 30)
returns table (
  kind text,
  total bigint,
  failed bigint,
  credits bigint,
  tokens_in bigint,
  tokens_out bigint,
  avg_seconds numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select g.kind::text,
         count(*),
         count(*) filter (where g.status = 'failed'),
         coalesce(sum(g.cost_credits) filter (where g.status = 'success'), 0),
         coalesce(sum(g.tokens_in), 0),
         coalesce(sum(g.tokens_out), 0),
         round(avg(extract(epoch from (g.completed_at - g.created_at)))
               filter (where g.completed_at is not null)::numeric, 1)
  from generations g
  where g.created_at > now() - make_interval(days => p_days)
  group by g.kind
  order by count(*) desc;
$$;

revoke execute on function public.admin_overview(integer) from public, anon, authenticated;
revoke execute on function public.admin_list_users(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.admin_user_emails(uuid[]) from public, anon, authenticated;
revoke execute on function public.admin_user_auth(uuid) from public, anon, authenticated;
revoke execute on function public.admin_generation_stats(integer) from public, anon, authenticated;
grant execute on function public.admin_overview(integer) to service_role;
grant execute on function public.admin_list_users(text, integer, integer) to service_role;
grant execute on function public.admin_user_emails(uuid[]) to service_role;
grant execute on function public.admin_user_auth(uuid) to service_role;
grant execute on function public.admin_generation_stats(integer) to service_role;
