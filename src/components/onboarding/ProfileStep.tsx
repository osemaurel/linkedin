import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormError, SubmitButton, TextAreaField, TextField } from '@/components/fields';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { parseProfile } from '@/lib/parseProfile';
import { supabase } from '@/lib/supabase';

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const GENERIC_ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

const linkButton =
  'block rounded-md py-1.5 text-left text-sm font-medium text-sky-700 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60';

function Pending({ title }: { title: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900"
    >
      <Spinner className="h-5 w-5 text-sky-600" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sky-900/70">Ça prend une vingtaine de secondes.</p>
      </div>
    </div>
  );
}

export function ProfileStep({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const userId = user?.id as string;
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'pdf' | 'paste'>('pdf');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [experiences, setExperiences] = useState('');

  async function finish() {
    await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    onDone();
  }

  const importPdf = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const path = `${userId}/linkedin-profile.pdf`;
      const { error } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' });
      setUploading(false);
      if (error) throw new Error('L’envoi du PDF a échoué. Vérifie ta connexion et réessaie.');
      return parseProfile({ source: 'pdf', path });
    },
    onSuccess: finish,
    onError: (e) => {
      setUploading(false);
      setError(e.message);
    },
  });

  const importPaste = useMutation({
    mutationFn: async () => {
      if (!headline.trim() && !about.trim() && !experiences.trim()) {
        throw new Error('Colle au moins une section de ton profil.');
      }
      return parseProfile({ source: 'paste', headline, about, experiences });
    },
    onSuccess: finish,
    onError: (e) => setError(e.message),
  });

  const noAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('strategic_profiles')
        .upsert({ user_id: userId, raw_source: { source: 'none' } }, { onConflict: 'user_id' });
      if (error) throw new Error(GENERIC_ERROR);
    },
    onSuccess: finish,
    onError: (e) => setError(e.message),
  });

  const busy = importPdf.isPending || importPaste.isPending || noAccount.isPending;

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Choisis un fichier PDF.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError('Ce PDF dépasse 5 Mo. L’export LinkedIn fait en général moins de 1 Mo.');
      return;
    }
    setError(null);
    importPdf.mutate(file);
  }

  function handlePaste(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    importPaste.mutate();
  }

  function switchMode(next: 'pdf' | 'paste') {
    setError(null);
    setMode(next);
  }

  if (mode === 'paste') {
    return (
      <form onSubmit={handlePaste} noValidate className="space-y-4">
        <p className="text-sm text-slate-600">
          Copie ces sections depuis ton profil LinkedIn et colle-les ici, telles quelles.
        </p>
        <TextField
          label="Titre"
          hint="La ligne affichée sous ton nom."
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          disabled={busy}
        />
        <TextAreaField
          label="Infos"
          rows={4}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          disabled={busy}
        />
        <TextAreaField
          label="Expériences"
          rows={6}
          hint="Colle toute la section, on s’occupe de la mise en forme."
          value={experiences}
          onChange={(e) => setExperiences(e.target.value)}
          disabled={busy}
        />
        <FormError message={error} />
        {importPaste.isPending && experiences.trim() && (
          <Pending title="Lecture de tes expériences…" />
        )}
        <SubmitButton pending={importPaste.isPending}>
          {importPaste.isPending ? 'Enregistrement…' : 'Continuer'}
        </SubmitButton>
        <button
          type="button"
          onClick={() => switchMode('pdf')}
          disabled={busy}
          className={linkButton}
        >
          Importer un PDF à la place
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Importe le PDF de ton profil LinkedIn : on en tire tout le reste.
      </p>

      {importPdf.isPending ? (
        <Pending title={uploading ? 'Envoi du PDF…' : 'Lecture de ton profil…'} />
      ) : (
        <>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFile}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Choisir mon PDF LinkedIn
          </button>
        </>
      )}

      <FormError message={error} />

      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">
          Comment récupérer ce PDF ?
        </summary>
        <p className="mt-2">
          Sur la version ordinateur de LinkedIn, ouvre ton profil, clique sur « Plus » sous ta
          photo, puis sur « Enregistrer au format PDF ». Sur téléphone, le plus simple est de coller
          ton profil.
        </p>
      </details>

      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => switchMode('paste')}
          disabled={busy}
          className={linkButton}
        >
          Pas de PDF sous la main ? Colle ton profil
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            noAccount.mutate();
          }}
          disabled={busy}
          className={`${linkButton} flex items-center gap-2`}
        >
          Je n’ai pas encore de compte LinkedIn
          {noAccount.isPending && <Spinner />}
        </button>
      </div>
    </div>
  );
}
