-- Mon réseau
-- Pas de liste nominative : le ciblage et les requêtes LinkedIn vivent dans targets,
-- l'utilisateur colle les profils trouvés dans contacts.

create table targets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  job_titles text[] not null default '{}',
  sectors text[] not null default '{}',
  countries text[] not null default '{}',
  company_sizes text[] not null default '{}',
  saved_queries jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  headline text,
  company text,
  profile_url text,
  status contact_status not null default 'contacted',
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_user_status on contacts (user_id, status);
create index idx_contacts_user_followup
  on contacts (user_id, next_followup_at)
  where next_followup_at is not null;

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  kind contact_message_kind not null,
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  -- Note de connexion LinkedIn : 300 caractères max.
  constraint connection_note_length check (
    kind <> 'connection_note' or char_length(body) <= 300
  )
);

create index idx_contact_messages_contact on contact_messages (contact_id);
