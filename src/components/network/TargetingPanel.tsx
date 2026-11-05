import { useState } from 'react';
import { PaidAction } from '@/components/credits/PaidAction';
import { TagsEditor } from '@/components/profile/TagsEditor';
import {
  generateTargeting,
  linkedinSearchUrl,
  saveTargets,
  type SavedQuery,
  type Targets,
} from '@/lib/network';

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

function QueryCard({ query }: { query: SavedQuery }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(query.keywords);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée par le navigateur : la requête reste sélectionnable à la main.
    }
  }
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="font-semibold text-slate-900">{query.label}</h4>
      {query.why && <p className="mt-1 text-sm text-slate-600">{query.why}</p>}
      <p className="mt-3 select-all break-words rounded-lg bg-slate-50 px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-800">
        {query.keywords}
      </p>
      {query.filters.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-500">Filtres à régler sur LinkedIn</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {query.filters.map((f) => (
              <li key={f} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a
          href={linkedinSearchUrl(query.keywords)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Ouvrir dans LinkedIn
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? '✓ Copiée' : 'Copier la requête'}
        </button>
      </div>
    </article>
  );
}

type Props = {
  userId: string;
  targets: Targets | null;
  onChange: (targets: Targets) => void;
  onGenerated: () => Promise<void>;
};

const LISTS: {
  key: keyof Omit<Targets, 'queries'>;
  column: 'job_titles' | 'sectors' | 'countries' | 'company_sizes';
  label: string;
  placeholder: string;
}[] = [
  {
    key: 'jobTitles',
    column: 'job_titles',
    label: 'Intitulés de poste',
    placeholder: 'Ajouter un intitulé',
  },
  { key: 'sectors', column: 'sectors', label: 'Secteurs', placeholder: 'Ajouter un secteur' },
  {
    key: 'countries',
    column: 'countries',
    label: 'Pays et villes',
    placeholder: 'Ajouter un lieu',
  },
  {
    key: 'companySizes',
    column: 'company_sizes',
    label: 'Tailles d’entreprise',
    placeholder: 'Ex. : PME de 10 à 200 salariés',
  },
];

export function TargetingPanel({ userId, targets, onChange, onGenerated }: Props) {
  if (!targets) {
    return (
      <section className={card}>
        <h2 className="font-semibold text-slate-900">Qui contacter, et comment les trouver</h2>
        <p className="mb-4 mt-1.5 text-sm text-slate-600">
          On part de ton profil et de ton objectif pour définir ta cible : intitulés de poste,
          secteurs, pays, tailles d’entreprise. Puis on écrit les recherches LinkedIn qui la
          trouvent : tu obtiens ta liste toi-même, en un clic.
        </p>
        <PaidAction
          kind="targeting"
          label="Définir ma cible"
          pendingLabel="Ciblage en cours…"
          pendingText="On définit ta cible et on écrit tes recherches LinkedIn, une quinzaine de secondes."
          run={generateTargeting}
          onDone={onGenerated}
        />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${card} space-y-5`}>
        <div>
          <h2 className="font-semibold text-slate-900">Ta cible</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ajuste librement : chaque ajout ou retrait est enregistré.
          </p>
        </div>
        {LISTS.map((l) => (
          <TagsEditor
            key={l.key}
            label={l.label}
            tags={targets[l.key]}
            placeholder={l.placeholder}
            emptyText="Rien pour l’instant."
            onChange={(tags) => onChange({ ...targets, [l.key]: tags })}
            onSave={(tags) => saveTargets(userId, { [l.column]: tags })}
          />
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Tes recherches LinkedIn
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Ouvre une recherche, règle les filtres indiqués, puis copie le profil des personnes
          intéressantes dans l’onglet Messages. LinkedIn limite le nombre d’invitations par semaine
          : avance par petits lots et personnalise chaque note.
        </p>
        <div className="mt-3 space-y-3">
          {targets.queries.map((q) => (
            <QueryCard key={q.label} query={q} />
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-slate-900">Refaire le ciblage</h2>
        <p className="mb-4 mt-1.5 text-sm text-slate-600">
          Utile après avoir changé d’objectif ou enrichi ton profil. Ta cible et tes recherches
          actuelles seront remplacées.
        </p>
        <PaidAction
          kind="targeting"
          label="Nouveau ciblage"
          pendingLabel="Ciblage en cours…"
          pendingText="On redéfinit ta cible et tes recherches LinkedIn, une quinzaine de secondes."
          confirm="Ta cible et tes recherches actuelles seront remplacées. Continuer ?"
          run={generateTargeting}
          onDone={onGenerated}
        />
      </section>
    </div>
  );
}
