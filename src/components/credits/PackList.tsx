import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
import type { Pack } from '@/hooks/usePricing';
import { formatPrice } from '@/lib/credits';
import { createPayment } from '@/lib/payments';

const PAYMENT_NOTE = 'Paiement par mobile money sur la page sécurisée de SasPay.';

function BuyButton({
  pending,
  disabled,
  onClick,
  compact,
}: {
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
  compact: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? 'px-3 py-2 text-sm' : 'mt-4 px-4 py-2.5 text-sm'
      }`}
    >
      {pending && <Spinner />}
      {pending ? 'Ouverture…' : 'Acheter'}
    </button>
  );
}

export function PackList({ packs, compact = false }: { packs: Pack[]; compact?: boolean }) {
  // En cas de succès, la page part vers SasPay : l'état « en cours » reste affiché.
  const buy = useMutation({
    mutationFn: createPayment,
    onSuccess: ({ checkout_url }) => window.location.assign(checkout_url),
  });
  const { reset } = buy;
  // Retour depuis SasPay avec « Précédent » : la page sort du cache, on réactive les boutons.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && reset();
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, [reset]);
  const busy = buy.isPending || buy.isSuccess;
  const buttonFor = (pack: Pack) => (
    <BuyButton
      pending={busy && buy.variables === pack.id}
      disabled={busy}
      onClick={() => buy.mutate(pack.id)}
      compact={compact}
    />
  );

  return (
    <div>
      <ul className={compact ? 'space-y-2' : 'grid gap-3 sm:grid-cols-3'}>
        {packs.map((pack) =>
          compact ? (
            <li
              key={pack.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{pack.name}</p>
                <p className="text-sm text-slate-600">
                  {pack.credits} crédits ·{' '}
                  <span className="font-medium tabular-nums text-slate-900">
                    {formatPrice(pack.price, pack.currency)}
                  </span>
                </p>
              </div>
              {buttonFor(pack)}
            </li>
          ) : (
            <li
              key={pack.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">{pack.name}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {pack.credits}
                <span className="ml-1 text-sm font-normal text-slate-500">crédits</span>
              </p>
              <p className="text-sm text-slate-600">{formatPrice(pack.price, pack.currency)}</p>
              {buttonFor(pack)}
            </li>
          ),
        )}
      </ul>
      {buy.isError && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {buy.error.message}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">{PAYMENT_NOTE}</p>
    </div>
  );
}
