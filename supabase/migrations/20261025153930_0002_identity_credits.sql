-- Identité et crédits
-- Les mouvements de crédits et les paiements sont la source de vérité : credits_balance
-- sur profiles est recalculé par trigger (voir 0006_functions.sql).

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  country text,
  objective user_objective,
  credits_balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason credit_reason not null,
  ref_id uuid,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index idx_credit_transactions_user_created
  on credit_transactions (user_id, created_at desc);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider payment_provider not null,
  provider_ref text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'XOF',
  credits integer not null check (credits >= 0),
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint payments_provider_ref_unique unique (provider, provider_ref)
);

create index idx_payments_user_created on payments (user_id, created_at desc);

create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind generation_kind not null,
  status generation_status not null default 'pending',
  cost_credits integer not null default 0 check (cost_credits >= 0),
  tokens_in integer,
  tokens_out integer,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_generations_user_created on generations (user_id, created_at desc);
