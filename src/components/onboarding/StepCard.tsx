import type { ReactNode } from 'react';

type Props = {
  number: number;
  title: string;
  state: 'done' | 'current' | 'upcoming';
  summary?: ReactNode;
  onEdit?: () => void;
  children?: ReactNode;
};

export function StepCard({ number, title, state, summary, onEdit, children }: Props) {
  if (state === 'current') {
    return (
      <section
        aria-current="step"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-600 text-sm font-semibold text-white">
            {number}
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    );
  }

  if (state === 'done') {
    return (
      <section className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 px-5 py-4">
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-slate-500">
            <span className="sr-only">Terminé : </span>
            {title}
          </h2>
          <p className="mt-0.5 line-clamp-2 break-words text-sm text-slate-900">{summary}</p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Modifier : ${title}`}
            className="-my-1 shrink-0 rounded-md px-2 py-1 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Modifier
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="flex items-center gap-3 px-5 py-2 text-slate-400">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-300 text-xs font-semibold">
        {number}
      </span>
      <h2 className="text-sm font-medium">{title}</h2>
    </section>
  );
}
