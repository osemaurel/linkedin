import { TagsEditor } from './TagsEditor';

type Props = {
  skills: string[];
  onChange: (skills: string[]) => void;
  onSave: (skills: string[]) => Promise<void>;
};

export function SkillsEditor({ skills, onChange, onSave }: Props) {
  return (
    <TagsEditor
      label="Compétences"
      tags={skills}
      onChange={onChange}
      onSave={onSave}
      placeholder="Ajouter une compétence"
      emptyText="Aucune compétence pour l’instant."
      inputLabel="Nouvelle compétence"
    />
  );
}
