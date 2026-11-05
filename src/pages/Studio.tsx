import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/Spinner';
import { Composer } from '@/components/studio/Composer';
import { Library } from '@/components/studio/Library';
import { PostEditor } from '@/components/studio/PostEditor';
import { VoicePanel } from '@/components/studio/VoicePanel';
import { useAuth } from '@/hooks/useAuth';
import { deletePost, fetchStudio, type StudioData, type StudioPost } from '@/lib/studio';

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

function Workspace({
  initial,
  initialSelected,
  preselectedSlot,
  reload,
}: {
  initial: StudioData;
  initialSelected: string | null;
  preselectedSlot: string | null;
  reload: (selectPostId?: string | null) => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [posts, setPosts] = useState(initial.posts);
  const [selectedId, setSelectedId] = useState(initialSelected);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLElement>(null);
  const selected = posts.find((p) => p.id === selectedId) ?? null;
  const preselected = initial.openSlots.find((s) => s.id === preselectedSlot) ?? null;

  // Le cache suit les modifications : revenir sur la page n'affiche jamais un état ancien.
  useEffect(() => {
    queryClient.setQueryData<StudioData>(['studio', user?.id], (d) => (d ? { ...d, posts } : d));
  }, [posts, queryClient, user?.id]);

  useEffect(() => {
    if (selectedId) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedId]);

  const change = (id: string, patch: Partial<StudioPost>) =>
    setPosts((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function remove(post: StudioPost) {
    setError(null);
    try {
      await deletePost(post);
      void queryClient.invalidateQueries({ queryKey: ['plan'] });
      await reload(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <section className={`${card} space-y-5`}>
        <h2 className="font-semibold text-slate-900">Nouveau post</h2>
        <Composer
          upcoming={initial.upcoming}
          preselected={preselected}
          onWritten={async (postId) => {
            void queryClient.invalidateQueries({ queryKey: ['plan'] });
            await reload(postId);
          }}
        />
        <div className="border-t border-slate-100 pt-4">
          <VoicePanel voice={initial.voice} onLearned={() => void reload(selectedId)} />
        </div>
      </section>

      {selected && (
        <section ref={editorRef} className={`${card} scroll-mt-20`} aria-label="Post sélectionné">
          <PostEditor
            key={selected.id}
            post={selected}
            onChange={(patch) => change(selected.id, patch)}
            onDelete={() => void remove(selected)}
          />
        </section>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Bibliothèque</h2>
        <p className="mt-1 text-sm text-slate-600">Tes brouillons et tes posts publiés.</p>
        <div className="mt-3">
          <Library posts={posts} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </section>
    </>
  );
}

export default function Studio() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const studio = useQuery({
    queryKey: ['studio', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchStudio(user?.id as string),
    staleTime: 0,
  });
  // Après une rédaction ou une suppression : l'espace repart des données enregistrées.
  const [session, setSession] = useState({ version: 0, selected: params.get('post') });

  async function reload(selectPostId?: string | null) {
    await studio.refetch();
    setSession((s) => ({
      version: s.version + 1,
      selected: selectPostId === undefined ? s.selected : selectPostId,
    }));
  }

  let body;
  if (studio.isPending) {
    body = (
      <div className="grid place-items-center py-16 text-blue-600" role="status">
        <Spinner className="h-6 w-6" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  } else if (studio.isError) {
    body = (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>Impossible de charger le Studio.</p>
        <button
          type="button"
          onClick={() => void studio.refetch()}
          className="mt-2 font-medium underline"
        >
          Réessayer
        </button>
      </div>
    );
  } else {
    body = (
      <Workspace
        key={session.version}
        initial={studio.data}
        initialSelected={session.selected}
        preselectedSlot={session.version === 0 ? params.get('slot') : null}
        reload={reload}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Studio</h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          Rédige tes posts dans ta voix, à partir de ton plan ou d’un sujet libre.
        </p>
      </header>
      {body}
    </div>
  );
}
