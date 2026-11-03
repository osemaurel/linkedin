/**
 * Seule source des coûts et des packs. Les Edge Functions débitent avec COSTS,
 * l'application les lit via la fonction `pricing` : aucun coût n'est écrit en dur côté client.
 */
export const COSTS = {
  audit: 5,
  block_rewrite: 0,
  profile_parse: 0,
  pillars: 2,
  content_plan: 3,
  plan_slot: 0,
  post: 1,
  post_refine: 0,
  voice_profile: 0,
  targeting: 1,
  outreach_message: 1,
  carousel: 0,
  image: 5,
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
  { kind: 'pillars', label: 'Proposition de stratégie de contenu', cost: COSTS.pillars },
  { kind: 'content_plan', label: 'Plan éditorial', cost: COSTS.content_plan },
  { kind: 'plan_slot', label: 'Nouvel angle pour un créneau', cost: COSTS.plan_slot },
  { kind: 'post', label: 'Rédaction d’un post', cost: COSTS.post },
  { kind: 'post_refine', label: 'Retouche d’un post', cost: COSTS.post_refine },
  { kind: 'voice_profile', label: 'Apprentissage de ta voix', cost: COSTS.voice_profile },
  { kind: 'targeting', label: 'Ciblage et recherches LinkedIn', cost: COSTS.targeting },
  { kind: 'outreach_message', label: 'Messages d’approche', cost: COSTS.outreach_message },
  { kind: 'carousel', label: 'Carrousel', cost: COSTS.carousel },
  { kind: 'image', label: 'Image d’illustration', cost: COSTS.image },
];

// Montants provisoires : le prix des packs reste à fixer (voir le cadrage, « Monétisation »).
export const PACKS = [
  { id: 'decouverte', name: 'Découverte', credits: 10, price: 1000, currency: 'XOF' },
  { id: 'essentiel', name: 'Essentiel', credits: 30, price: 2500, currency: 'XOF' },
  { id: 'pro', name: 'Pro', credits: 80, price: 6000, currency: 'XOF' },
];
