import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
import { useActionCost, type PricedAction } from '@/hooks/usePricing';
import { useProfile } from '@/hooks/useProfile';
import { useRecharge } from '@/hooks/useRecharge';
import { formatCost, formatCredits, refreshCredits } from '@/lib/credits';
import { FunctionError } from '@/lib/edgeFunctions';

type Props<T> = {
  kind: PricedAction;
  label: string;
  pendingLabel: string;
  /** Phrase affichée pendant la génération. */
  pendingText: string;
  /** Question posée avant de lancer (remplacement de données). */
  confirm?: string;
  disabled?: boolean;
  run: () => Promise<T>;
  onDone: (result: T) => Promise<void> | void;
};

/**
 * Action payante : coût et solde lus avant le clic, écran de recharge si le solde manque
 * (lu ou refusé par le serveur), jamais de message d'erreur pour un solde insuffisant.
 */
export function PaidAction<T>({
  kind,
  label,
  pendingLabel,
  pendingText,
  confirm,
  disabled,
  run,
  onDone,
}: Props<T>) {
  const queryClient = useQueryClient();
  const cost = useActionCost(kind);
  const balance = useProfile().data?.credits_balance;
  const { canAfford, askRecharge, handleError } = useRecharge();

  const action = useMutation({
    mutationFn: run,
    onSuccess: async (result) => {
      refreshCredits(queryClient);
      await onDone(result);
    },
    onError: (e) => {
      if (handleError(e, kind)) refreshCredits(queryClient);
    },
  });
  const error =
    action.error instanceof FunctionError && action.error.code === 'insufficient_credits'
      ? null
      : action.error;

  function start() {
    if (confirm && !window.confirm(confirm)) return;
    if (!canAfford(kind)) {
      action.reset();
      askRecharge(kind);
      return;
    }
    action.mutate();
  }

  return (
    <div className="space-y-3">
      <div>
        <button
          type="button"
          onClick={start}
          disabled={action.isPending || disabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {action.isPending && <Spinner />}
          {action.isPending ? pendingLabel : label}
        </button>
        <p className="mt-1.5 text-xs text-slate-500">
          Coût : {cost === undefined ? '…' : formatCost(cost)} · solde :{' '}
          {balance === undefined ? '…' : formatCredits(balance)}
        </p>
      </div>
      {action.isPending && (
        <p role="status" className="text-sm text-slate-600">
          {pendingText}
        </p>
      )}
      {error && !action.isPending && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}
