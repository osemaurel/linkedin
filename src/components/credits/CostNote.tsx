import { actionOf, usePricing, type PricedAction } from '@/hooks/usePricing';
import { formatCost } from '@/lib/credits';

/** Coût d'une action, lu depuis le serveur, affiché avant de la lancer. */
export function CostNote({ kind, className = '' }: { kind: PricedAction; className?: string }) {
  const { data } = usePricing();
  const action = actionOf(data, kind);
  if (!action) return null;
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      {action.label} : <span className="font-medium text-slate-700">{formatCost(action.cost)}</span>
    </p>
  );
}
