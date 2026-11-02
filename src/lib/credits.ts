import type { QueryClient } from '@tanstack/react-query';

const numberFormat = new Intl.NumberFormat('fr-FR');

export function formatCredits(n: number): string {
  return `${numberFormat.format(n)} ${Math.abs(n) > 1 ? 'crédits' : 'crédit'}`;
}

/** Coût d'une action tel qu'affiché avant de la lancer. */
export function formatCost(cost: number): string {
  return cost === 0 ? 'Gratuit' : formatCredits(cost);
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Relit le solde et l'historique après une action qui a pu débiter (ou être refusée). */
export function refreshCredits(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['profile'] });
  void queryClient.invalidateQueries({ queryKey: ['credit-history'] });
}
