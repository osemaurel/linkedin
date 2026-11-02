-- SasPay encaisse les recharges de crédits (mobile money, Afrique de l'Ouest).
-- La contrainte unique (provider, provider_ref) s'applique telle quelle :
-- provider_ref reçoit l'identifiant de la session de paiement SasPay.
alter type payment_provider add value if not exists 'saspay';
