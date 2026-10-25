import type { Enums } from './database.types';

export type Objective = Enums<'user_objective'>;

export const OBJECTIVES: readonly {
  value: Objective;
  label: string;
  description: string;
  example: string;
}[] = [
  {
    value: 'job',
    label: 'Décrocher un poste',
    description: 'Être repéré par les recruteurs et les managers.',
    example: 'Ex. : un poste de chef de projet digital dans une banque à Abidjan.',
  },
  {
    value: 'clients',
    label: 'Trouver des clients',
    description: 'Freelance, consultant ou prestataire : remplir ton carnet.',
    example: 'Ex. : signer trois PME clientes par mois pour mes services de comptabilité.',
  },
  {
    value: 'visibility',
    label: 'Développer ma visibilité',
    description: 'Devenir une référence sur ton sujet.',
    example: 'Ex. : devenir une référence de la cybersécurité au Sénégal.',
  },
];

export function objectiveLabel(value: Objective): string {
  return OBJECTIVES.find((o) => o.value === value)?.label ?? value;
}
