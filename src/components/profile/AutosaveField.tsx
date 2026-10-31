import { useId } from 'react';
import { useAutosave, type SaveStatus } from '@/hooks/useAutosave';
import { inputClass } from '@/lib/ui';

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const label =
    status === 'saving'
      ? 'Enregistrement…'
      : status === 'saved'
        ? '✓ Enregistré'
        : status === 'error'
          ? 'Échec de l’enregistrement'
          : '';
  return (
    <span
      aria-live="polite"
      className={`shrink-0 text-xs ${status === 'error' ? 'text-red-600' : 'text-slate-500'}`}
    >
      {label}
    </span>
  );
}

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  type?: 'text' | 'month';
};

/** Champ édité en place : enregistré 0,8 s après la dernière frappe, ou à la sortie du champ. */
export function AutosaveField({
  label,
  value,
  onChange,
  onSave,
  hint,
  placeholder,
  multiline,
  rows = 4,
  maxLength,
  showCount,
  type = 'text',
}: Props) {
  const id = useId();
  const { status, schedule, flush } = useAutosave(onSave);

  function change(next: string) {
    onChange(next);
    schedule(next);
  }

  const shared = { id, value, placeholder, maxLength, onBlur: flush };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <SaveIndicator status={status} />
      </div>
      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          className={`${inputClass} resize-y`}
          onChange={(e) => change(e.target.value)}
        />
      ) : (
        <input
          {...shared}
          type={type}
          className={inputClass}
          onChange={(e) => change(e.target.value)}
        />
      )}
      {(hint || (showCount && maxLength)) && (
        <div className="mt-1.5 flex justify-between gap-3 text-xs text-slate-500">
          <span>{hint}</span>
          {showCount && maxLength && (
            <span className="tabular-nums">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
