import { useState } from 'react';
import { FormError } from '@/components/fields';
import type { ProfileExperience } from '@/hooks/useFullProfile';
import { saveExperience } from '@/lib/profileApi';
import { supabase } from '@/lib/supabase';
import { AutosaveField } from './AutosaveField';

const MONTH = /^\d{4}-\d{2}$/;
const toMonth = (date: string | null) => (date ? date.slice(0, 7) : '');
const toDate = (month: string) => (MONTH.test(month) ? `${month}-01` : null);
const COLUMNS = 'id, title, company, start_date, end_date, description, position';
const ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

function ExperienceCard({
  experience,
  index,
  onChange,
  onRemove,
}: {
  experience: ProfileExperience;
  index: number;
  onChange: (patch: Partial<ProfileExperience>) => void;
  onRemove: () => void;
}) {
  const [start, setStart] = useState(toMonth(experience.start_date));
  const [end, setEnd] = useState(toMonth(experience.end_date));
  const save = (patch: Partial<ProfileExperience>) => saveExperience(experience.id, patch);
  // Une date tapée à moitié (navigateurs sans sélecteur de mois) n'efface pas l'ancienne.
  const saveMonth = (field: 'start_date' | 'end_date') => async (month: string) => {
    if (month && !MONTH.test(month)) return;
    await save({ [field]: toDate(month) });
  };

  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
      <legend className="sr-only">Expérience {index + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <AutosaveField
          label="Intitulé du poste"
          value={experience.title}
          onChange={(title) => onChange({ title })}
          onSave={(title) => save({ title: title.trim() })}
        />
        <AutosaveField
          label="Entreprise"
          value={experience.company ?? ''}
          onChange={(company) => onChange({ company })}
          onSave={(company) => save({ company: company.trim() || null })}
        />
        <AutosaveField
          type="month"
          label="Début"
          value={start}
          onChange={(month) => {
            setStart(month);
            onChange({ start_date: toDate(month) });
          }}
          onSave={saveMonth('start_date')}
        />
        <AutosaveField
          type="month"
          label="Fin"
          hint="Laisse vide si c’est ton poste actuel."
          value={end}
          onChange={(month) => {
            setEnd(month);
            onChange({ end_date: toDate(month) });
          }}
          onSave={saveMonth('end_date')}
        />
      </div>
      <AutosaveField
        multiline
        rows={5}
        label="Description"
        maxLength={2000}
        showCount
        value={experience.description ?? ''}
        onChange={(description) => onChange({ description })}
        onSave={(description) => save({ description: description.trim() || null })}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Supprimer cette expérience
        </button>
      </div>
    </fieldset>
  );
}

type Props = {
  userId: string;
  experiences: ProfileExperience[];
  onChange: (experiences: ProfileExperience[]) => void;
};

export function ExperiencesEditor({ userId, experiences, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setAdding(true);
    setError(null);
    const position = experiences.reduce((max, e) => Math.max(max, e.position), -1) + 1;
    const { data, error } = await supabase
      .from('experiences')
      .insert({ user_id: userId, title: '', position })
      .select(COLUMNS)
      .single();
    setAdding(false);
    if (error) return setError(ERROR);
    onChange([...experiences, data]);
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer cette expérience ?')) return;
    setError(null);
    const { error } = await supabase.from('experiences').delete().eq('id', id);
    if (error) return setError(ERROR);
    onChange(experiences.filter((e) => e.id !== id));
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-700">Expériences</h3>
      <div className="space-y-4">
        {experiences.length === 0 && (
          <p className="text-sm text-slate-500">Aucune expérience pour l’instant.</p>
        )}
        {experiences.map((experience, index) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            index={index}
            onChange={(patch) =>
              onChange(experiences.map((e) => (e.id === experience.id ? { ...e, ...patch } : e)))
            }
            onRemove={() => void remove(experience.id)}
          />
        ))}
        <FormError message={error} />
        <button
          type="button"
          onClick={() => void add()}
          disabled={adding}
          className="rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700 disabled:opacity-60"
        >
          + Ajouter une expérience
        </button>
      </div>
    </div>
  );
}
