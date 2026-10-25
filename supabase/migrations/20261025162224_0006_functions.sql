-- Fonctions et triggers
-- 1. updated_at automatique
-- 2. Création du profil à l'inscription
-- 3. Calcul de balance_after + synchronisation de credits_balance
-- 4. Débit automatique au succès d'une génération
-- 5. Crédit automatique à l'encaissement d'un paiement
-- Le verrou sur profiles.credits_balance est posé par droits de colonne (0007_rls.sql).

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_strategic_profiles_updated_at
  before update on strategic_profiles
  for each row execute function set_updated_at();

create trigger trg_experiences_updated_at
  before update on experiences
  for each row execute function set_updated_at();

create trigger trg_content_pillars_updated_at
  before update on content_pillars
  for each row execute function set_updated_at();

create trigger trg_plan_slots_updated_at
  before update on plan_slots
  for each row execute function set_updated_at();

create trigger trg_posts_updated_at
  before update on posts
  for each row execute function set_updated_at();

create trigger trg_contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create trigger trg_targets_updated_at
  before update on targets
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- credit_transactions : balance_after calculé, profiles.credits_balance resynchronisé
-- ---------------------------------------------------------------------------
create or replace function credit_transactions_set_balance_after()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_current integer;
begin
  -- Sérialise les mouvements d'un même utilisateur : sans ce verrou, deux
  -- débits concurrents liraient le même solde.
  perform 1 from profiles where id = new.user_id for update;

  select coalesce(sum(delta), 0)
    into v_current
    from credit_transactions
    where user_id = new.user_id;
  new.balance_after := v_current + new.delta;
  return new;
end;
$$;

create trigger trg_credit_transactions_balance_after
  before insert on credit_transactions
  for each row execute function credit_transactions_set_balance_after();

create or replace function credit_transactions_sync_profile()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  select coalesce(sum(delta), 0)
    into v_balance
    from credit_transactions
    where user_id = v_user_id;
  update profiles
    set credits_balance = v_balance
    where id = v_user_id;
  return null;
end;
$$;

create trigger trg_credit_transactions_sync_profile
  after insert or update or delete on credit_transactions
  for each row execute function credit_transactions_sync_profile();

-- ---------------------------------------------------------------------------
-- Débit automatique au succès d'une génération
-- Le cadrage impose : « On insère la ligne generations avant l'appel IA,
-- et on ne débite qu'au passage au statut success. »
-- ---------------------------------------------------------------------------
create or replace function generations_charge_on_success()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'success'
     and old.status is distinct from 'success'
     and new.cost_credits > 0
  then
    insert into credit_transactions (user_id, delta, reason, ref_id)
    values (new.user_id, -new.cost_credits, 'generation_debit', new.id);
  end if;
  if new.status in ('success', 'failed') and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_generations_charge
  before update on generations
  for each row execute function generations_charge_on_success();

-- ---------------------------------------------------------------------------
-- Crédit automatique à l'encaissement d'un paiement
-- Idempotence : la contrainte unique (provider, provider_ref) empêche un
-- webhook rejoué de créer un second paiement. Le passage à 'succeeded' ne
-- déclenche l'insertion dans credit_transactions qu'une seule fois.
-- ---------------------------------------------------------------------------
create or replace function payments_credit_on_success()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'succeeded'
     and old.status is distinct from 'succeeded'
     and new.credits > 0
  then
    insert into credit_transactions (user_id, delta, reason, ref_id)
    values (new.user_id, new.credits, 'purchase', new.id);
    if new.completed_at is null then
      new.completed_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_payments_credit
  before update on payments
  for each row execute function payments_credit_on_success();
