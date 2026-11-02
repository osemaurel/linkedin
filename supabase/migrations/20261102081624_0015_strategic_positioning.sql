-- Stratégie de contenu : le positionnement en une phrase, lu ensuite par le plan
-- éditorial, le Studio et Mon réseau. L'audience reste target_audience.
alter table strategic_profiles add column if not exists positioning text;
