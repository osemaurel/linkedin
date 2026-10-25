-- Enums
-- Champs à valeurs fermées listés dans le cadrage : objective, status, format, kind, reason, impact.
-- status et kind sont déclinés par table : chaque occurrence a son propre type.

create type user_objective as enum ('job', 'clients', 'visibility');

create type credit_reason as enum (
  'signup_grant',
  'purchase',
  'generation_debit',
  'refund',
  'manual_adjust'
);

create type payment_provider as enum ('moneyfusion', 'moneroo', 'pawapay', 'stripe');

create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create type generation_kind as enum (
  'audit',
  'block_rewrite',
  'profile_full',
  'pillars',
  'content_plan',
  'post',
  'carousel',
  'image',
  'outreach_message'
);

create type generation_status as enum ('pending', 'success', 'failed');

create type suggestion_impact as enum ('low', 'medium', 'high');

create type post_format as enum ('text', 'carousel', 'image');

create type plan_slot_status as enum ('planned', 'drafted', 'published', 'skipped');

create type post_tone as enum ('professional', 'conversational', 'direct');

create type post_status as enum ('draft', 'scheduled', 'published', 'archived');

create type asset_kind as enum ('carousel', 'image');

create type contact_status as enum ('contacted', 'replied', 'in_discussion', 'closed');

create type contact_message_kind as enum ('connection_note', 'follow_up', 'reminder');
