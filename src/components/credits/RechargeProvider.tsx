import { useState, type ReactNode } from 'react';
import { actionOf, usePricing, type PricedAction } from '@/hooks/usePricing';
import { useProfile } from '@/hooks/useProfile';
import { RechargeContext } from '@/hooks/useRecharge';
import { RechargeDialog } from './RechargeDialog';

/** Un seul écran de recharge pour toute l'application, ouvert via useRecharge(). */
export function RechargeProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<PricedAction | null>(null);
  const pricing = usePricing();
  const profile = useProfile();
  const action = kind ? actionOf(pricing.data, kind) : undefined;

  return (
    <RechargeContext.Provider value={setKind}>
      {children}
      <RechargeDialog
        open={kind !== null}
        onClose={() => setKind(null)}
        label={action?.label}
        cost={action?.cost}
        balance={profile.data?.credits_balance}
        packs={pricing.data?.packs ?? []}
      />
    </RechargeContext.Provider>
  );
}
