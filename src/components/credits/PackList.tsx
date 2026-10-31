import type { Pack } from '@/hooks/usePricing';
import { formatPrice } from '@/lib/credits';

const PAYMENT_PENDING = 'Le paiement par mobile money arrive très bientôt.';

export function PackList({ packs, compact = false }: { packs: Pack[]; compact?: boolean }) {
  return (
    <div>
      <ul className={compact ? 'space-y-2' : 'grid gap-3 sm:grid-cols-3'}>
        {packs.map((pack) =>
          compact ? (
            <li
              key={pack.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{pack.name}</p>
                <p className="text-sm text-slate-600">{pack.credits} crédits</p>
              </div>
              <p className="font-semibold tabular-nums text-slate-900">
                {formatPrice(pack.price, pack.currency)}
              </p>
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
              <button
                type="button"
                disabled
                className="mt-4 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Bientôt disponible
              </button>
            </li>
          ),
        )}
      </ul>
      <p className="mt-3 text-xs text-slate-500">{PAYMENT_PENDING}</p>
    </div>
  );
}
