import { BLOCK_LABELS, IMPACT_LABELS, type Impact, type QuickWin } from '@/lib/audit';

const IMPACT_TONE: Record<Impact, string> = {
  high: 'bg-sky-600 text-white',
  medium: 'bg-sky-100 text-sky-800',
  low: 'bg-slate-100 text-slate-600',
};

export function QuickWins({ wins }: { wins: QuickWin[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">Actions rapides</h2>
      <p className="mt-1 text-sm text-slate-600">
        Moins de dix minutes chacune, de la plus utile à la moins utile.
      </p>
      <ol className="mt-3 space-y-2">
        {wins.map((w, i) => (
          <li
            key={`${w.block}-${i}`}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${IMPACT_TONE[w.impact]}`}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-900">{w.action}</p>
              <p className="mt-1 text-xs text-slate-500">
                <a href={`#bloc-${w.block}`} className="hover:text-sky-700 hover:underline">
                  {BLOCK_LABELS[w.block]}
                </a>{' '}
                · {IMPACT_LABELS[w.impact]}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
