-- Studio : retouche d'un post (« Affiner ») et apprentissage de la voix,
-- tracés à part de la rédaction d'un post (kind 'post').
alter type generation_kind add value if not exists 'post_refine';
alter type generation_kind add value if not exists 'voice_profile';
