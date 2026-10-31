import { useEffect, useRef, useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={[
        'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors',
        state === 'copied'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        {state === 'copied' ? (
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        ) : (
          <path d="M7 3a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7Zm6 11v1H4V8h1v4a2 2 0 0 0 2 2h6Zm1-2H7V5h7v7Z" />
        )}
      </svg>
      <span aria-live="polite">
        {state === 'copied' ? 'Copié' : state === 'failed' ? 'Copie impossible' : 'Copier'}
      </span>
    </button>
  );
}
