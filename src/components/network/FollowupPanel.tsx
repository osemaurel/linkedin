import { isDue, STATUSES, type Contact } from '@/lib/network';
import { ContactCard } from './ContactCard';

type Props = {
  contacts: Contact[];
  openId: string | null;
  onChange: (id: string, patch: Partial<Contact>) => void;
  onDelete: (id: string) => void;
};

/** Pipeline de suivi : d'abord les relances du jour, puis chaque étape. */
export function FollowupPanel({ contacts, openId, onChange, onDelete }: Props) {
  if (!contacts.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        Aucun contact pour l’instant. Colle le profil d’une personne trouvée dans l’onglet Messages
        : elle apparaîtra ici, avec ses messages et ses relances.
      </p>
    );
  }

  const due = contacts.filter(isDue);
  const card = (c: Contact) => (
    <ContactCard
      key={c.id}
      contact={c}
      defaultOpen={c.id === openId}
      onChange={(patch) => onChange(c.id, patch)}
      onDelete={() => onDelete(c.id)}
    />
  );

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Contacts par étape">
        {STATUSES.map((s) => (
          <li key={s.value} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="block text-xl font-semibold tabular-nums text-slate-900">
              {contacts.filter((c) => c.status === s.value).length}
            </span>
            <span className="text-xs text-slate-600">{s.label}</span>
          </li>
        ))}
      </ol>

      {due.length > 0 && (
        <section aria-label="À relancer">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">
            À relancer aujourd’hui ({due.length})
          </h3>
          <div className="space-y-3">{due.map(card)}</div>
        </section>
      )}

      {STATUSES.map((s) => {
        const group = contacts.filter((c) => c.status === s.value && !isDue(c));
        if (!group.length) return null;
        return (
          <section key={s.value} aria-label={s.label}>
            <h3 className="mb-2 text-sm font-semibold text-slate-500">
              {s.label} ({group.length})
            </h3>
            <div className="space-y-3">{group.map(card)}</div>
          </section>
        );
      })}
    </div>
  );
}
