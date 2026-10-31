-- Lecture du profil à l'entrée (Edge Function parse-profile) : un appel IA tracé
-- dans generations comme les autres, sans coût en crédits.

alter type generation_kind add value if not exists 'profile_parse';
