-- Plan éditorial : nouvel angle pour un seul créneau, tracé à part du plan complet.
alter type generation_kind add value if not exists 'plan_slot';
