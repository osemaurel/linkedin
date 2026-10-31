-- Profil éditable et entretien progressif.
-- skills : les compétences deviennent une colonne éditable (elles n'existaient que
-- dans raw_source->parsed). audit_questions : une question par information
-- manquante, posée une à la fois, dont la réponse alimente proofs.

alter table strategic_profiles add column skills text[] not null default '{}';

update strategic_profiles
   set skills = array(select jsonb_array_elements_text(raw_source->'parsed'->'skills'))
 where jsonb_typeof(raw_source->'parsed'->'skills') = 'array';

create type question_status as enum ('pending', 'answered', 'skipped');

create table audit_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  audit_id uuid not null references audits (id) on delete cascade,
  block text not null,
  question text not null,
  proof_label text not null,
  position smallint not null default 0,
  status question_status not null default 'pending',
  answer text,
  proof_id uuid references proofs (id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_audit_questions_audit on audit_questions (audit_id, position);
create index idx_audit_questions_user on audit_questions (user_id);
create index idx_audit_questions_proof on audit_questions (proof_id);

alter table audit_questions enable row level security;
create policy "audit_questions_owner_all"
  on audit_questions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
