import { useState, type FormEvent } from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { inputClass } from '@/lib/ui';
import { SaveIndicator } from './AutosaveField';

type Props = {
  skills: string[];
  onChange: (skills: string[]) => void;
  onSave: (skills: string[]) => Promise<void>;
};

export function SkillsEditor({ skills, onChange, onSave }: Props) {
  const [input, setInput] = useState('');
  const { status, schedule } = useAutosave(onSave, 300);

  function update(next: string[]) {
    onChange(next);
    schedule(next);
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const skill = input.trim();
    if (!skill) return;
    if (!skills.some((s) => s.toLowerCase() === skill.toLowerCase())) update([...skills, skill]);
    setInput('');
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-700">Compétences</h3>
        <SaveIndicator status={status} />
      </div>
      {skills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm text-slate-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => update(skills.filter((s) => s !== skill))}
                aria-label={`Retirer ${skill}`}
                className="grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Aucune compétence pour l’instant.</p>
      )}
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ajouter une compétence"
          aria-label="Nouvelle compétence"
          maxLength={80}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
}
