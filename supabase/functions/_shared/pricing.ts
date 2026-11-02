/**
 * Seule source des coûts et des packs. Les Edge Functions débitent avec COSTS,
 * l'application les lit via la fonction `pricing` : aucun coût n'est écrit en dur côté client.
 */
export const COSTS = {
  audit: 5,
  block_rewrite: 0,
  profile_parse: 0,
} as const;

export type PricedAction = keyof typeof COSTS;

export const ACTIONS: { kind: PricedAction; label: string; cost: number }[] = [
  { kind: 'audit', label: 'Audit complet du profil', cost: COSTS.audit },
  {
    kind: 'block_rewrite',
    label: 'Réponse à une question de l’audit',
    cost: COSTS.block_rewrite,
  },
  { kind: 'profile_parse', label: 'Lecture de ton profil LinkedIn', cost: COSTS.profile_parse },
];

// Montants provisoires : le prix des packs reste à fixer (voir le cadrage, « Monétisation »).
export const PACKS = [
  { id: 'decouverte', name: 'Découverte', credits: 10, price: 1000, currency: 'XOF' },
  { id: 'essentiel', name: 'Essentiel', credits: 30, price: 2500, currency: 'XOF' },
  { id: 'pro', name: 'Pro', credits: 80, price: 6000, currency: 'XOF' },
];
