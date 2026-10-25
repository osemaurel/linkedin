-- handle_new_user est une fonction trigger SECURITY DEFINER : on retire l'exécution
-- via l'API (/rest/v1/rpc) signalée par le conseiller de sécurité Supabase.
-- Le trigger sur auth.users continue de fonctionner (le droit EXECUTE n'est
-- vérifié qu'à la création du trigger).

revoke execute on function public.handle_new_user() from public, anon, authenticated;
