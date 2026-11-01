-- Le registre n'est jamais modifié à la main : une suppression ne vient que de la
-- suppression du compte (cascade depuis auth.users). Le trigger AFTER s'exécute alors
-- avec le rôle du service d'authentification, sans droit sur credit_transactions, et
-- faisait échouer la suppression (« permission denied for table credit_transactions »).
-- Le profil est supprimé dans la même cascade : il n'y a rien à resynchroniser.
create or replace function credit_transactions_sync_profile()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  if tg_op = 'DELETE' then
    return null;
  end if;

  v_user_id := new.user_id;
  select coalesce(sum(delta), 0)
    into v_balance
    from credit_transactions
    where user_id = v_user_id;
  update profiles
    set credits_balance = v_balance
    where id = v_user_id;
  return null;
end;
$$;
