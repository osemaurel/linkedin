-- Audit : les quick wins sont stockés avec l'audit, et consume_credits clôt une
-- génération réussie. Le débit lui-même reste fait par le trigger
-- generations_charge_on_success (passage à 'success'), seule source de débit.

alter table audits add column quick_wins jsonb not null default '[]'::jsonb;

create or replace function consume_credits(
  p_generation_id uuid,
  p_tokens_in integer default null,
  p_tokens_out integer default null
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  update generations
     set status = 'success', tokens_in = p_tokens_in, tokens_out = p_tokens_out
   where id = p_generation_id and status = 'pending'
  returning user_id into v_user_id;

  if v_user_id is null then
    raise exception 'génération % introuvable ou déjà terminée', p_generation_id;
  end if;

  select credits_balance into v_balance from profiles where id = v_user_id;
  return v_balance;
end;
$$;

-- Réservée aux Edge Functions (service_role).
revoke execute on function consume_credits(uuid, integer, integer) from public, anon, authenticated;
