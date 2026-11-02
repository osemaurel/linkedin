import { createContext, useCallback, useContext } from 'react';
import { FunctionError } from '@/lib/edgeFunctions';
import { actionOf, usePricing, type PricedAction } from './usePricing';
import { useProfile } from './useProfile';

export const RechargeContext = createContext<(kind: PricedAction) => void>(() => {});

/**
 * Garde-fou avant une action payante. Le serveur reste seul juge : `canAfford` ne fait que
 * comparer le solde lu au coût lu, et une réponse 402 ouvre aussi l'écran de recharge.
 */
export function useRecharge() {
  const ask = useContext(RechargeContext);
  const pricing = usePricing();
  const profile = useProfile();

  const canAfford = useCallback(
    (kind: PricedAction) => {
      const cost = actionOf(pricing.data, kind)?.cost;
      const balance = profile.data?.credits_balance;
      return cost === undefined || balance === undefined || balance >= cost;
    },
    [pricing.data, profile.data],
  );

  /** Ouvre l'écran de recharge si l'erreur est un solde insuffisant ; renvoie vrai dans ce cas. */
  const handleError = useCallback(
    (error: unknown, kind: PricedAction) => {
      if (error instanceof FunctionError && error.code === 'insufficient_credits') {
        ask(kind);
        return true;
      }
      return false;
    },
    [ask],
  );

  return { askRecharge: ask, canAfford, handleError };
}
