-- Contenu
-- Piliers → plan → créneaux → posts → assets.
-- plan_slots.post_id et posts.slot_id forment une référence croisée : la FK sur
-- plan_slots.post_id est ajoutée après la création de posts.

create table content_pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_content_pillars_user_pos on content_pillars (user_id, position);

create table content_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  horizon smallint not null check (horizon in (30, 60, 90)),
  start_date date not null,
  created_at timestamptz not null default now()
);

create index idx_content_plans_user on content_plans (user_id, start_date desc);

create table plan_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references content_plans (id) on delete cascade,
  scheduled_date date not null,
  pillar_id uuid references content_pillars (id) on delete set null,
  format post_format not null,
  angle text,
  status plan_slot_status not null default 'planned',
  post_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_plan_slots_plan_date on plan_slots (plan_id, scheduled_date);
create index idx_plan_slots_user_date on plan_slots (user_id, scheduled_date);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slot_id uuid references plan_slots (id) on delete set null,
  pillar_id uuid references content_pillars (id) on delete set null,
  body text,
  tone post_tone,
  status post_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_posts_user_status on posts (user_id, status);
create index idx_posts_slot on posts (slot_id);

alter table plan_slots
  add constraint plan_slots_post_id_fkey
  foreign key (post_id) references posts (id) on delete set null;

create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references posts (id) on delete cascade,
  kind asset_kind not null,
  storage_path text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_assets_user on assets (user_id);
create index idx_assets_post on assets (post_id);
