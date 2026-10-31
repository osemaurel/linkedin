import { Link } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { AUDIT_COST } from '@/lib/audit';
import { formatCredits } from '@/lib/credits';
import { FunctionError } from '@/lib/edgeFunctions';

type Props = {
  hasAudit: boolean;
  balance: number | undefined;
  pending: boolean;
  error: Error | null;
  onRun: () => void;
};

const linkClass = 'font-medium text-sky-700 underline hover:text-sky-800';

export function RunAuditControl({ hasAudit, balance, pending, error, onRun }: Props) {
  const insufficient = balance !== undefined && balance < AUDIT_COST;
  const code = error instanceof FunctionError ? error.code : undefined;

  return (
    <div className="w-full sm:w-auto sm:max-w-xs">
      <button
        type="button"
        onClick={onRun}
        disabled={pending || insufficient}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? 'Analyse en cours…' : hasAudit ? 'Relancer l’audit' : 'Lancer mon audit'}
      </button>
      <p className="mt-1.5 text-center text-xs text-slate-500 sm:text-right">
        {formatCredits(AUDIT_COST)} · solde : {balance === undefined ? '…' : formatCredits(balance)}
      </p>

      {pending && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          On analyse ton profil, compte environ une minute.
        </p>
      )}

      {insufficient && !pending && (
        <p className="mt-3 text-sm text-slate-700">
          Il te faut {formatCredits(AUDIT_COST)} pour lancer un audit.{' '}
          <Link to="/compte" className={linkClass}>
            Recharger
          </Link>
        </p>
      )}

      {error && !pending && !insufficient && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {error.message}{' '}
          {code === 'insufficient_credits' && (
            <Link to="/compte" className={linkClass}>
              Recharger
            </Link>
          )}
          {code === 'profile_missing' && (
            <Link to="/demarrer" className={linkClass}>
              Présenter mon profil
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
