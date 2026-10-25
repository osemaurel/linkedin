-- Row Level Security
-- Règle du cadrage :
--   - RLS activée partout, politique auth.uid() = user_id.
--   - credit_transactions, payments et generations : lecture seule côté client.
--     L'écriture passe par les Edge Functions avec le service_role (qui
--     contourne la RLS).
--   - profiles : lecture + mise à jour par le propriétaire ; credits_balance
--     est verrouillé par un trigger (voir 0006_functions.sql).
--   - audits : écriture réservée au service_role (lecture seule côté client)
--     puisqu'ils sont le résultat d'un appel IA tracé dans generations.

-- ---------------------------------------------------------------------------
-- Lecture seule côté client
-- ---------------------------------------------------------------------------
alter table credit_transactions enable row level security;
create policy "credit_transactions_select_own"
  on credit_transactions for select
  to authenticated
  using (auth.uid() = user_id);

alter table payments enable row level security;
create policy "payments_select_own"
  on payments for select
  to authenticated
  using (auth.uid() = user_id);

alter table generations enable row level security;
create policy "generations_select_own"
  on generations for select
  to authenticated
  using (auth.uid() = user_id);

alter table audits enable row level security;
create policy "audits_select_own"
  on audits for select
  to authenticated
  using (auth.uid() = user_id);

alter table audit_suggestions enable row level security;
create policy "audit_suggestions_select_own"
  on audit_suggestions for select
  to authenticated
  using (auth.uid() = user_id);
create policy "audit_suggestions_update_applied"
  on audit_suggestions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- profiles : lecture + update, pas de delete, pas d'insert
-- (l'insertion se fait par handle_new_user)
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (auth.uid() = id);
create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Tables CRUD complet par le propriétaire
-- ---------------------------------------------------------------------------
alter table strategic_profiles enable row level security;
create policy "strategic_profiles_owner_all"
  on strategic_profiles for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table experiences enable row level security;
create policy "experiences_owner_all"
  on experiences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table proofs enable row level security;
create policy "proofs_owner_all"
  on proofs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table content_pillars enable row level security;
create policy "content_pillars_owner_all"
  on content_pillars for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table content_plans enable row level security;
create policy "content_plans_owner_all"
  on content_plans for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table plan_slots enable row level security;
create policy "plan_slots_owner_all"
  on plan_slots for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table posts enable row level security;
create policy "posts_owner_all"
  on posts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table assets enable row level security;
create policy "assets_owner_all"
  on assets for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table targets enable row level security;
create policy "targets_owner_all"
  on targets for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table contacts enable row level security;
create policy "contacts_owner_all"
  on contacts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table contact_messages enable row level security;
create policy "contact_messages_owner_all"
  on contact_messages for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
