export type MenuItem = {
  path: string;
  label: string;
  short: string;
  /** Module pas encore construit : affiché grisé, avec « Bientôt ». */
  soon?: boolean;
};

export const MENUS: readonly MenuItem[] = [
  { path: '/', label: 'Tableau de bord', short: 'Accueil' },
  { path: '/profil', label: 'Mon profil', short: 'Profil' },
  { path: '/audit', label: 'Audit & optimisation', short: 'Audit' },
  { path: '/strategie', label: 'Stratégie de contenu', short: 'Stratégie' },
  { path: '/plan', label: 'Plan éditorial', short: 'Plan' },
  { path: '/studio', label: 'Studio', short: 'Studio' },
  { path: '/reseau', label: 'Mon réseau', short: 'Réseau', soon: true },
  { path: '/compte', label: 'Compte', short: 'Compte' },
] as const;
