import { useId, useState } from 'react';
import { PaidAction } from '@/components/credits/PaidAction';
import { MAX_PROFILE_TEXT, MIN_PROFILE_TEXT, writeOutreach } from '@/lib/network';
import { inputClass } from '@/lib/ui';

/** Profil collé → note de connexion, message de suivi et relance, et contact suivi. */
export function OutreachForm({ onWritten }: { onWritten: (contactId: string) => Promise<void> }) {
  const id = useId();
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const missing = MIN_PROFILE_TEXT - text.trim().length;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="font-semibold text-slate-900">Écrire à une personne trouvée</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Sur LinkedIn, ouvre son profil, sélectionne le texte de la page (nom, titre, Infos,
          expériences) et colle-le ici. On croise son profil avec le tien pour écrire la note de
          connexion, le message de suivi et la relance. Le texte collé n’est pas conservé.
        </p>
      </div>
      <div>
        <label htmlFor={`${id}-text`} className="mb-1.5 block text-sm font-medium text-slate-700">
          Son profil
        </label>
        <textarea
          id={`${id}-text`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          maxLength={MAX_PROFILE_TEXT}
          className={`${inputClass} resize-y`}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          {missing > 0 ? `Encore ${missing} caractères au moins` : 'C’est suffisant'}
        </p>
      </div>
      <div>
        <label htmlFor={`${id}-url`} className="mb-1.5 block text-sm font-medium text-slate-700">
          Adresse de son profil <span className="font-normal text-slate-500">(facultatif)</span>
        </label>
        <input
          id={`${id}-url`}
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/…"
          className={inputClass}
        />
      </div>
      <PaidAction
        kind="outreach_message"
        label="Écrire mes messages"
        pendingLabel="Rédaction en cours…"
        pendingText="On croise les deux profils et on écrit tes trois messages, une dizaine de secondes."
        disabled={missing > 0}
        run={() => writeOutreach(text.trim(), url.trim())}
        onDone={async ({ contact_id }) => {
          setText('');
          setUrl('');
          await onWritten(contact_id);
        }}
      />
    </section>
  );
}
