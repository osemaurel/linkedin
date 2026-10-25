-- Storage
-- Deux buckets privés : uploads (PDF importés) et assets (visuels générés).
-- Convention de chemin : <user_id>/<...>. Les policies filtrent sur le
-- premier dossier du nom du fichier.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- uploads : lecture + écriture par le propriétaire du dossier racine
-- ---------------------------------------------------------------------------
create policy "uploads_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "uploads_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "uploads_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "uploads_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- assets : lecture par le propriétaire ; écriture réservée au service_role
-- (les visuels sont produits par les Edge Functions)
-- ---------------------------------------------------------------------------
create policy "assets_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
