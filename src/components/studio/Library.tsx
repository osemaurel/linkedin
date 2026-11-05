import { formatShortDay } from '@/lib/plan';
import type { StudioPost } from '@/lib/studio';

const createdFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

type Props = {
  posts: StudioPost[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Bibliothèque : brouillons et posts publiés, du plus récent au plus ancien. */
export function Library({ posts, selectedId, onSelect }: Props) {
  if (!posts.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        Tes posts rédigés apparaîtront ici, en brouillon ou publiés.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      {posts.map((post) => {
        const firstLine = post.body.split('\n').find((l) => l.trim()) ?? 'Post vide';
        return (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => onSelect(post.id)}
              aria-current={post.id === selectedId ? 'true' : undefined}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                post.id === selectedId ? 'bg-blue-50' : ''
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-900">{firstLine}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {post.slot ? (
                    <>
                      Prévu le <span>{formatShortDay(post.slot.date)}</span>
                      {post.slot.pillarName ? ` · ${post.slot.pillarName}` : ''}
                    </>
                  ) : (
                    `Sujet libre · écrit le ${createdFormat.format(new Date(post.createdAt))}`
                  )}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  post.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {post.status === 'published' ? 'Publié' : 'Brouillon'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
