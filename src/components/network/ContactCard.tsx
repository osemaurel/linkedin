import { useEffect, useId, useRef, useState } from 'react';
import { AutosaveField } from '@/components/profile/AutosaveField';
import {
  isDue,
  isLinkedinProfileUrl,
  markSent,
  MESSAGE_KINDS,
  saveContactStatus,
  saveFollowup,
  saveMessage,
  STATUS_LABELS,
  STATUSES,
  type Contact,
  type ContactMessage,
  type ContactStatus,
} from '@/lib/network';
import { formatDayMonth } from '@/lib/plan';
import { inputClass } from '@/lib/ui';

const STATUS_COLORS: Record<ContactStatus, string> = {
  contacted: 'bg-slate-100 text-slate-700',
  replied: 'bg-sky-100 text-sky-800',
  in_discussion: 'bg-violet-100 text-violet-800',
  closed: 'bg-emerald-100 text-emerald-800',
};

const sentFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const smallButton =
  'inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60';

function MessageBlock({
  contactId,
  message,
  onChange,
  onSent,
}: {
  contactId: string;
  message: ContactMessage;
  onChange: (patch: Partial<ContactMessage>) => void;
  onSent: (followup: string | null) => void;
}) {
  const kind = MESSAGE_KINDS.find((k) => k.value === message.kind)!;
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('La copie a échoué : sélectionne le texte et copie-le à la main.');
    }
  }

  async function toggleSent() {
    setBusy(true);
    setError(null);
    try {
      const { sentAt, followup } = await markSent(contactId, message, !message.sentAt);
      onChange({ sentAt });
      if (sentAt) onSent(followup);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 sm:p-4">
      <AutosaveField
        label={kind.label}
        hint={kind.hint}
        value={message.body}
        multiline
        autoGrow
        rows={3}
        maxLength={kind.max}
        showCount={kind.value === 'connection_note'}
        onChange={(body) => onChange({ body })}
        onSave={(body) => saveMessage(message.id, body)}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void copy()} className={smallButton}>
          {copied ? '✓ Copié' : 'Copier'}
        </button>
        <button
          type="button"
          onClick={() => void toggleSent()}
          disabled={busy}
          className={smallButton}
        >
          {message.sentAt ? 'Annuler « envoyé »' : 'Marquer comme envoyé'}
        </button>
        {message.sentAt && (
          <span className="text-xs font-medium text-emerald-700">
            ✓ Envoyé le {sentFormat.format(new Date(message.sentAt))}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type Props = {
  contact: Contact;
  onChange: (patch: Partial<Contact>) => void;
  onDelete: () => void;
  defaultOpen?: boolean;
};

export function ContactCard({ contact, onChange, onDelete, defaultOpen = false }: Props) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const due = isDue(contact);

  useEffect(() => {
    if (defaultOpen) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [defaultOpen]);

  async function apply(patch: Partial<Contact>, save: () => Promise<void>) {
    const previous = { status: contact.status, followupDate: contact.followupDate };
    setError(null);
    onChange(patch);
    try {
      await save();
    } catch (e) {
      onChange(previous);
      setError((e as Error).message);
    }
  }

  const changeMessage = (messageId: string, patch: Partial<ContactMessage>) =>
    onChange({
      messages: contact.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
    });

  return (
    <article
      ref={ref}
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-slate-900">{contact.fullName}</span>
          {(contact.headline || contact.company) && (
            <span className="mt-0.5 block text-sm text-slate-600">
              {contact.headline ?? contact.company}
            </span>
          )}
          {contact.followupDate && contact.status !== 'closed' && (
            <span
              className={`mt-1 block text-xs font-medium ${due ? 'text-amber-700' : 'text-slate-500'}`}
            >
              {due ? 'À relancer' : 'Relance prévue'} le {formatDayMonth(contact.followupDate)}
            </span>
          )}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[contact.status]}`}
        >
          {STATUS_LABELS[contact.status]}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${id}-status`}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Où en êtes-vous ?
              </label>
              <select
                id={`${id}-status`}
                value={contact.status}
                onChange={(e) => {
                  const status = e.target.value as ContactStatus;
                  void apply(
                    status === 'closed' ? { status, followupDate: null } : { status },
                    () => saveContactStatus(contact.id, status),
                  );
                }}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`${id}-followup`}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Relance prévue le
              </label>
              <input
                id={`${id}-followup`}
                type="date"
                value={contact.followupDate ?? ''}
                disabled={contact.status === 'closed'}
                onChange={(e) => {
                  const day = e.target.value || null;
                  void apply({ followupDate: day }, () => saveFollowup(contact.id, day));
                }}
                className={inputClass}
              />
            </div>
          </div>

          {isLinkedinProfileUrl(contact.profileUrl) && (
            <a
              href={contact.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-sky-700 hover:underline"
            >
              Ouvrir son profil LinkedIn
            </a>
          )}

          <div className="space-y-3">
            {contact.messages.map((m) => (
              <MessageBlock
                key={m.id}
                contactId={contact.id}
                message={m}
                onChange={(patch) => changeMessage(m.id, patch)}
                onSent={(followup) => onChange({ followupDate: followup })}
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                window.confirm(`Supprimer ${contact.fullName} et ses messages ?`) && onDelete()
              }
              className="rounded-md px-2 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Supprimer ce contact
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
