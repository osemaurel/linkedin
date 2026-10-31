import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Sauvegarde différée : `schedule` relance le minuteur à chaque frappe, `flush` enregistre
 * tout de suite (perte de focus, démontage). Les envois sont mis en file pour qu'une
 * ancienne valeur n'écrase jamais une plus récente.
 */
export function useAutosave<T>(save: (value: T) => Promise<void>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const saveRef = useRef(save);
  const pending = useRef<{ value: T } | null>(null);
  const timer = useRef<number>();
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    setStatus('saving');
    queue.current = queue.current
      .then(() => saveRef.current(next.value))
      .then(
        () => {
          if (!pending.current) setStatus('saved');
        },
        () => setStatus('error'),
      );
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pending.current = { value };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => flush, [flush]);

  return { status, schedule, flush };
}
