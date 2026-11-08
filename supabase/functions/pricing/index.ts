import { serve } from '../_shared/http.ts';
import { loadActions, loadPacks } from '../_shared/pricing.ts';

// Lus en base à chaque appel : un tarif changé au centre de contrôle s'affiche tout de suite.
serve(async () => {
  const [actions, packs] = await Promise.all([loadActions(), loadPacks()]);
  return {
    actions: actions.map(({ kind, label, cost }) => ({ kind, label, cost })),
    packs: packs.map(({ id, name, credits, price, currency }) => ({
      id,
      name,
      credits,
      price,
      currency,
    })),
  };
});
