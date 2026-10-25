-- Profil Stratégique
-- Objet pivot : une ligne par utilisateur, enrichie en continu.

create table strategic_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  headline text,
  about text,
  offer text,
  target_audience text,
  voice jsonb not null default '{}'::jsonb,
  raw_source jsonb,
  completeness smallint not null default 0 check (completeness between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  company text,
  start_date date,
  end_date date,
  description text,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_experiences_user_pos on experiences (user_id, position);

create table proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  value text,
  context text,
  source text,
  created_at timestamptz not null default now()
);

create index idx_proofs_user on proofs (user_id);

create table audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score_global smallint check (score_global between 0 and 100),
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audits_user_created on audits (user_id, created_at desc);

create table audit_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  audit_id uuid not null references audits (id) on delete cascade,
  block text not null,
  variant_index smallint not null default 0,
  content text not null,
  impact suggestion_impact not null default 'medium',
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_audit_suggestions_audit on audit_suggestions (audit_id);
create index idx_audit_suggestions_user on audit_suggestions (user_id);
