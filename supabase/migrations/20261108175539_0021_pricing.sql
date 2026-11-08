-- Tarifs modifiables depuis le centre de contrôle : le coût de chaque action et les packs
-- de crédits vivent en base. Les Edge Functions les lisent à chaque appel ; seules les
-- fonctions d'administration ci-dessous les modifient, avec leur entrée au journal.

create table public.action_costs (
  kind public.generation_kind primary key,
  cost integer not null check (cost between 0 and 1000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.credit_packs (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,29}$'),
  name text not null check (char_length(name) between 2 and 40),
  credits integer not null check (credits between 1 and 100000),
  price integer not null check (price between 100 and 10000000),
  currency text not null default 'XOF' check (currency = 'XOF'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.action_costs enable row level security;
alter table public.credit_packs enable row level security;
revoke all on public.action_costs from anon, authenticated;
revoke all on public.credit_packs from anon, authenticated;

-- Valeurs reprises de l'ancien barème écrit dans le code.
insert into public.action_costs (kind, cost) values
  ('audit', 5),
  ('block_rewrite', 0),
  ('profile_parse', 0),
  ('pillars', 2),
  ('content_plan', 3),
  ('plan_slot', 0),
  ('post', 1),
  ('post_refine', 0),
  ('voice_profile', 0),
  ('targeting', 1),
  ('outreach_message', 1),
  ('carousel', 0),
  ('image', 5);

insert into public.credit_packs (id, name, credits, price) values
  ('decouverte', 'Découverte', 10, 1000),
  ('essentiel', 'Essentiel', 30, 2500),
  ('pro', 'Pro', 80, 6000);

-- Coûts : { "audit": 5, "post": 1, ... }. Seules les valeurs qui changent sont écrites,
-- et une seule entrée au journal liste les changements (avant, après).
create or replace function public.admin_set_costs(p_admin uuid, p_costs jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_val jsonb;
  v_num numeric;
  v_before integer;
  v_changes jsonb := '[]'::jsonb;
begin
  if coalesce(jsonb_typeof(p_costs), '') <> 'object' then
    raise exception 'bad_request';
  end if;

  for v_key, v_val in select key, value from jsonb_each(p_costs) loop
    if jsonb_typeof(v_val) <> 'number' then
      raise exception 'bad_cost';
    end if;
    v_num := v_val::numeric;
    if v_num <> trunc(v_num) or v_num < 0 or v_num > 1000 then
      raise exception 'bad_cost';
    end if;

    select cost into v_before from action_costs where kind::text = v_key for update;
    if not found then
      raise exception 'unknown_action';
    end if;

    if v_before <> v_num::integer then
      update action_costs
         set cost = v_num::integer, updated_at = now(), updated_by = p_admin
       where kind::text = v_key;
      v_changes := v_changes
        || jsonb_build_object('kind', v_key, 'before', v_before, 'after', v_num::integer);
    end if;
  end loop;

  if jsonb_array_length(v_changes) > 0 then
    insert into admin_audit_log (admin_id, action, target_user, details)
    values (p_admin, 'update_costs', null, jsonb_build_object('changes', v_changes));
  end if;

  return jsonb_array_length(v_changes);
end;
$$;

-- Pack : sans id, création ; avec id, modification. Un pack n'est jamais supprimé
-- (il se désactive) et le dernier pack actif ne peut pas être désactivé.
create or replace function public.admin_save_pack(p_admin uuid, p_pack jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := nullif(trim(coalesce(p_pack->>'id', '')), '');
  v_name text := trim(coalesce(p_pack->>'name', ''));
  v_active boolean;
  v_credits integer;
  v_price integer;
  v_num numeric;
  v_before credit_packs;
  v_after credit_packs;
begin
  if char_length(v_name) not between 2 and 40 then
    raise exception 'bad_pack_name';
  end if;

  if coalesce(jsonb_typeof(p_pack->'credits'), '') <> 'number' then
    raise exception 'bad_pack_credits';
  end if;
  v_num := (p_pack->'credits')::numeric;
  if v_num <> trunc(v_num) or v_num < 1 or v_num > 100000 then
    raise exception 'bad_pack_credits';
  end if;
  v_credits := v_num::integer;

  if coalesce(jsonb_typeof(p_pack->'price'), '') <> 'number' then
    raise exception 'bad_pack_price';
  end if;
  v_num := (p_pack->'price')::numeric;
  if v_num <> trunc(v_num) or v_num < 100 or v_num > 10000000 then
    raise exception 'bad_pack_price';
  end if;
  v_price := v_num::integer;

  if coalesce(jsonb_typeof(p_pack->'active'), 'boolean') <> 'boolean' then
    raise exception 'bad_request';
  end if;
  v_active := coalesce((p_pack->'active')::boolean, true);

  if v_id is null then
    if (select count(*) from credit_packs) >= 12 then
      raise exception 'too_many_packs';
    end if;
    insert into credit_packs (id, name, credits, price, active, updated_by)
    values ('pack-' || substr(md5(gen_random_uuid()::text), 1, 8), v_name, v_credits, v_price,
            v_active, p_admin)
    returning * into v_after;

    insert into admin_audit_log (admin_id, action, target_user, details)
    values (p_admin, 'create_pack', null, jsonb_build_object(
      'pack', v_after.id,
      'after', jsonb_build_object('name', v_name, 'credits', v_credits, 'price', v_price,
                                  'active', v_active)));
  else
    select * into v_before from credit_packs where id = v_id for update;
    if not found then
      raise exception 'pack_not_found';
    end if;
    if v_before.active and not v_active
       and not exists (select 1 from credit_packs where active and id <> v_id) then
      raise exception 'last_active_pack';
    end if;

    update credit_packs
       set name = v_name, credits = v_credits, price = v_price, active = v_active,
           updated_at = now(), updated_by = p_admin
     where id = v_id
    returning * into v_after;

    if (v_before.name, v_before.credits, v_before.price, v_before.active)
       is distinct from (v_after.name, v_after.credits, v_after.price, v_after.active) then
      insert into admin_audit_log (admin_id, action, target_user, details)
      values (p_admin, 'update_pack', null, jsonb_build_object(
        'pack', v_id,
        'before', jsonb_build_object('name', v_before.name, 'credits', v_before.credits,
                                     'price', v_before.price, 'active', v_before.active),
        'after', jsonb_build_object('name', v_after.name, 'credits', v_after.credits,
                                    'price', v_after.price, 'active', v_after.active)));
    end if;
  end if;

  return to_jsonb(v_after) - 'updated_by';
end;
$$;

revoke execute on function public.admin_set_costs(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_save_pack(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.admin_set_costs(uuid, jsonb) to service_role;
grant execute on function public.admin_save_pack(uuid, jsonb) to service_role;
