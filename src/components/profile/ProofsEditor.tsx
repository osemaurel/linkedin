import { useState } from 'react';
import { FormError } from '@/components/fields';
import type { ProfileProof } from '@/hooks/useFullProfile';
import { saveProof } from '@/lib/profileApi';
import { supabase } from '@/lib/supabase';
import { AutosaveField } from './AutosaveField';

const ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

type Props = {
  userId: string;
  proofs: ProfileProof[];
  onChange: (proofs: ProfileProof[]) => void;
};

export function ProofsEditor({ userId, proofs, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (id: string, patch: Partial<ProfileProof>) =>
    onChange(proofs.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function add() {
    setAdding(true);
    setError(null);
    const { data, error } = await supabase
      .from('proofs')
      .insert({ user_id: userId, label: '', source: 'manuel' })
      .select('id, label, value, context, source')
      .single();
    setAdding(false);
    if (error) return setError(ERROR);
    onChange([...proofs, data]);
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer cette preuve ?')) return;
    setError(null);
    const { error } = await supabase.from('proofs').delete().eq('id', id);
    if (error) return setError(ERROR);
    onChange(proofs.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      {proofs.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          Aucune preuve pour l’instant. Les questions de ton audit en ajoutent au fil de l’eau, et
          tu peux en écrire toi-même.
        </p>
      )}
      {proofs.map((proof, index) => (
        <fieldset key={proof.id} className="space-y-3 rounded-lg border border-slate-200 p-4">
          <legend className="sr-only">Preuve {index + 1}</legend>
          {proof.source === 'entretien' && (
            <p className="text-xs font-medium text-sky-700">
              Ajoutée depuis une question de l’audit
            </p>
          )}
          <AutosaveField
            label="Ce que tu as accompli"
            placeholder="Ex. : Réduction du délai de clôture mensuelle"
            value={proof.label}
            onChange={(label) => update(proof.id, { label })}
            onSave={(label) => saveProof(proof.id, { label: label.trim() })}
          />
          <AutosaveField
            label="Le chiffre ou le résultat"
            placeholder="Ex. : -40 %"
            value={proof.value ?? ''}
            onChange={(value) => update(proof.id, { value })}
            onSave={(value) => saveProof(proof.id, { value: value.trim() || null })}
          />
          <AutosaveField
            label="Contexte (facultatif)"
            placeholder="Ex. : Banque Atlantique, 2022"
            value={proof.context ?? ''}
            onChange={(context) => update(proof.id, { context })}
            onSave={(context) => saveProof(proof.id, { context: context.trim() || null })}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void remove(proof.id)}
              className="rounded-md px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Supprimer cette preuve
            </button>
          </div>
        </fieldset>
      ))}
      <FormError message={error} />
      <button
        type="button"
        onClick={() => void add()}
        disabled={adding}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700 disabled:opacity-60"
      >
        + Ajouter une preuve
      </button>
    </div>
  );
}
