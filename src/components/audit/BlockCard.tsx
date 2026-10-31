import type { ReactNode } from 'react';
import { BLOCK_LABELS, IMPACT_LABELS, type Block, type BlockResult } from '@/lib/audit';
import { CopyButton } from './CopyButton';
import type { QuestionOutcome } from './QuestionPrompt';
import { Delta, ScoreBadge } from './Score';

type Props = {
  block: Block;
  result: BlockResult;
  previous?: BlockResult;
  rewrites: { id: string; content: string }[];
  /** Question de l'entretien progressif, affichée à l'endroit concerné. */
  question?: ReactNode;
  outcome?: QuestionOutcome;
};

const REWRITES_TITLE: Partial<Record<Block, string>> = {
  banner: 'Accroches pour ta bannière',
  skills: 'Liste proposée',
};

export function BlockCard({ block, result, previous, rewrites, question, outcome }: Props) {
  return (
    <details
      id={`bloc-${block}`}
      open={rewrites.length > 0 || Boolean(question) || Boolean(outcome)}
      className="group scroll-mt-32 rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{BLOCK_LABELS[block]}</h3>
          {rewrites.length > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">{IMPACT_LABELS[result.impact]}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={result.score} />
          <Delta current={result.score} previous={previous?.score} />
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          >
            <path
              fillRule="evenodd"
              d="M5.2 7.2a1 1 0 0 1 1.4 0L10 10.6l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.6a1 1 0 0 1 0-1.4Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <p className="text-sm leading-relaxed text-slate-700">
          {result.diagnostic || 'Pas de remarque particulière sur ce bloc.'}
        </p>

        {question && <div className="mt-4">{question}</div>}

        {outcome && (
          <p
            role="status"
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              outcome.kind === 'updated'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-amber-50 text-amber-900'
            }`}
          >
            {outcome.message}
          </p>
        )}

        {rewrites.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {REWRITES_TITLE[block] ?? 'Propositions prêtes à copier'}
            </h4>
            {rewrites.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-900">
                  {r.content}
                </p>
                <div className="mt-3 flex justify-end">
                  <CopyButton text={r.content} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
