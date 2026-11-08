-- Actions d'administration atomiques : la modification et son entrée au journal sont
-- enregistrées ensemble, ou pas du tout. Réservées au service_role (Edge Function admin).

create or replace function public.admin_adjust_credits(
  p_admin uuid,
  p_user uuid,
  p_delta integer,
  p_reason text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_log uuid;
  v_after integer;
begin
  if p_delta = 0 or abs(p_delta) > 10000 then
    raise exception 'bad_amount';
  end if;
  if char_length(coalesce(trim(p_reason), '')) not between 3 and 200 then
    raise exception 'reason_required';
  end if;

  -- Verrou sur le profil : deux ajustements simultanés ne lisent pas le même solde.
  select credits_balance into v_balance from profiles where id = p_user for update;
  if not found then
    raise exception 'user_not_found';
  end if;
  if v_balance + p_delta < 0 then
    raise exception 'negative_balance';
  end if;

  insert into admin_audit_log (admin_id, action, target_user, details)
  values (p_admin, 'adjust_credits', p_user,
          jsonb_build_object('delta', p_delta, 'reason', trim(p_reason), 'balance_before', v_balance))
  returning id into v_log;

  insert into credit_transactions (user_id, delta, reason, ref_id)
  values (p_user, p_delta, 'manual_adjust', v_log)
  returning balance_after into v_after;

  return v_after;
end;
$$;

create or replace function public.admin_set_admin(p_admin uuid, p_user uuid, p_grant boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_admin = p_user then
    raise exception 'self_change';
  end if;
  if not exists (select 1 from auth.users where id = p_user) then
    raise exception 'user_not_found';
  end if;

  if p_grant then
    insert into admin_users (user_id, granted_by) values (p_user, p_admin)
    on conflict (user_id) do nothing;
  else
    delete from admin_users where user_id = p_user;
  end if;

  insert into admin_audit_log (admin_id, action, target_user, details)
  values (p_admin, case when p_grant then 'grant_admin' else 'revoke_admin' end, p_user, '{}'::jsonb);

  return p_grant;
end;
$$;

revoke execute on function public.admin_adjust_credits(uuid, uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.admin_set_admin(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_adjust_credits(uuid, uuid, integer, text) to service_role;
grant execute on function public.admin_set_admin(uuid, uuid, boolean) to service_role;
