import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Pack } from '@/hooks/usePricing';
import { formatCredits } from '@/lib/credits';
import { PackList } from './PackList';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Libellé de l'action, lu depuis le serveur. */
  label: string | undefined;
  cost: number | undefined;
  balance: number | undefined;
  packs: Pack[];
};

const pending = '…';

/** Écran affiché quand le solde ne couvre pas une action : il propose de recharger. */
export function RechargeDialog({ open, onClose, label, cost, balance, packs }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-5 sm:p-6">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900">
          Recharge ton solde pour continuer
        </h2>
        <dl className="mt-4 divide-y divide-slate-100 rounded-lg bg-slate-50 px-4 text-sm">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-slate-600">{label ?? 'Cette action'}</dt>
            <dd className="shrink-0 font-semibold tabular-nums text-slate-900">
              {cost === undefined ? pending : formatCredits(cost)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-slate-600">Ton solde</dt>
            <dd className="shrink-0 font-semibold tabular-nums text-slate-900">
              {balance === undefined ? pending : formatCredits(balance)}
            </dd>
          </div>
        </dl>

        <h3 className="mt-5 text-sm font-medium text-slate-900">Choisis un pack</h3>
        <div className="mt-2">
          <PackList packs={packs} compact />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Link
            to="/compte"
            onClick={onClose}
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            Voir mon compte
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Plus tard
          </button>
        </div>
      </div>
    </dialog>
  );
}
