import { useEffect, useId, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaidAction } from '@/components/credits/PaidAction';
import { Spinner } from '@/components/Spinner';
import { useAutosave } from '@/hooks/useAutosave';
import { useProfile } from '@/hooks/useProfile';
import { inputClass } from '@/lib/ui';
import {
  exportCarouselPdf,
  fetchVisuals,
  generateImage,
  saveCarousel,
  signedUrl,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  THEMES,
  writeCarousel,
  type Carousel,
  type ImageStyle,
  type PostImage,
} from '@/lib/visuals';
import { SaveIndicator } from '@/components/profile/AutosaveField';
import { CarouselSlide } from './CarouselSlide';

const PREVIEW_SCALE = 0.2;
const button =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60';

function CarouselEditor({
  initial,
  onRegenerated,
  postId,
}: {
  initial: Carousel;
  postId: string;
  onRegenerated: () => Promise<void>;
}) {
  const id = useId();
  const author = useProfile().data?.full_name?.trim() ?? '';
  const [draft, setDraft] = useState(initial);
  const latest = useRef(draft);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status, schedule, flush } = useAutosave(() => saveCarousel(latest.current));

  function update(next: Carousel, immediate = false) {
    latest.current = next;
    setDraft(next);
    schedule(next);
    if (immediate) flush();
  }

  async function download() {
    setExporting(true);
    setError(null);
    try {
      const nodes = slideRefs.current
        .slice(0, draft.slides.length)
        .filter(Boolean) as HTMLElement[];
      await exportCarouselPdf(nodes, 'carrousel-linkedin.pdf');
    } catch {
      setError('L’export du PDF a échoué. Réessaie dans un instant.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Thème du carrousel" className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={draft.theme === t.id}
              onClick={() => update({ ...draft, theme: t.id }, true)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
                draft.theme === t.id
                  ? 'border-sky-500 text-sky-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-slate-300"
                style={{ background: t.bg, boxShadow: `inset 0 -6px 0 ${t.accent}` }}
              />
              {t.label}
            </button>
          ))}
        </div>
        <SaveIndicator status={status} />
      </div>

      <div
        className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2"
        aria-label={`Aperçu du carrousel, ${draft.slides.length} diapositives`}
      >
        {draft.slides.map((slide, i) => (
          <div
            key={i}
            className="shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 shadow-sm"
            style={{ width: SLIDE_WIDTH * PREVIEW_SCALE, height: SLIDE_HEIGHT * PREVIEW_SCALE }}
          >
            <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
              <CarouselSlide
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                slide={slide}
                index={i}
                total={draft.slides.length}
                theme={draft.theme}
                author={author}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void download()}
          disabled={exporting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {exporting && <Spinner />}
          {exporting ? 'Préparation du PDF…' : 'Télécharger le PDF'}
        </button>
        <button type="button" onClick={() => setEditing((e) => !e)} className={button}>
          {editing ? 'Fermer l’édition' : 'Modifier le texte'}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Sur LinkedIn, ajoute le PDF comme document à ton post : il s’affiche en carrousel.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {editing && (
        <ol className="space-y-3">
          {draft.slides.map((slide, i) => (
            <li key={i} className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-sky-700">Diapositive {i + 1}</p>
              <label htmlFor={`${id}-t${i}`} className="sr-only">
                Titre de la diapositive {i + 1}
              </label>
              <input
                id={`${id}-t${i}`}
                value={slide.title}
                maxLength={90}
                onChange={(e) =>
                  update({
                    ...draft,
                    slides: draft.slides.map((s, j) =>
                      j === i ? { ...s, title: e.target.value } : s,
                    ),
                  })
                }
                onBlur={flush}
                className={`${inputClass} font-semibold`}
              />
              <label htmlFor={`${id}-b${i}`} className="sr-only">
                Texte de la diapositive {i + 1}
              </label>
              <textarea
                id={`${id}-b${i}`}
                value={slide.body}
                maxLength={280}
                rows={3}
                onChange={(e) =>
                  update({
                    ...draft,
                    slides: draft.slides.map((s, j) =>
                      j === i ? { ...s, body: e.target.value } : s,
                    ),
                  })
                }
                onBlur={flush}
                className={`${inputClass} resize-y`}
              />
            </li>
          ))}
        </ol>
      )}

      <div className="border-t border-slate-100 pt-4">
        <PaidAction
          kind="carousel"
          label="Nouveau carrousel"
          pendingLabel="Préparation…"
          pendingText="On redécoupe ton post en diapositives, quelques secondes."
          confirm="Le carrousel actuel et tes modifications seront remplacés. Continuer ?"
          run={() => writeCarousel(postId)}
          onDone={onRegenerated}
        />
      </div>
    </div>
  );
}

function ImageView({ image }: { image: PostImage }) {
  const url = useQuery({
    queryKey: ['asset-url', image.path],
    queryFn: () => signedUrl(image.path),
    staleTime: 50 * 60 * 1000,
  });
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setError(null);
    try {
      const link = document.createElement('a');
      link.href = await signedUrl(image.path, 'image-linkedin.jpg');
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {url.data ? (
          <img
            src={url.data}
            alt="Image d’illustration du post"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-sky-600">
            <Spinner className="h-5 w-5" />
          </div>
        )}
      </div>
      <button type="button" onClick={() => void download()} className={button}>
        Télécharger l’image
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function ImageTab({
  postId,
  image,
  onGenerated,
}: {
  postId: string;
  image: PostImage | null;
  onGenerated: () => Promise<void>;
}) {
  const id = useId();
  const [style, setStyle] = useState<ImageStyle>(image?.style ?? 'photo');
  const [instruction, setInstruction] = useState('');

  return (
    <div className="space-y-5">
      {image ? (
        <ImageView image={image} />
      ) : (
        <p className="text-sm text-slate-600">
          Une image carrée qui illustre l’idée de ton post, sans texte, prête à joindre à ta
          publication.
        </p>
      )}
      <div className={`space-y-4 ${image ? 'border-t border-slate-100 pt-4' : ''}`}>
        <div role="radiogroup" aria-labelledby={`${id}-style`}>
          <p id={`${id}-style`} className="mb-1.5 text-sm font-medium text-slate-700">
            Style
          </p>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(
              [
                ['photo', 'Photo'],
                ['illustration', 'Illustration'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={style === value}
                onClick={() => setStyle(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  style === value ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            htmlFor={`${id}-instruction`}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Ce que tu veux voir <span className="font-normal text-slate-500">(facultatif)</span>
          </label>
          <input
            id={`${id}-instruction`}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            maxLength={300}
            placeholder="Ex. : un entrepôt à Abidjan, ambiance du matin"
            className={inputClass}
          />
        </div>
        <PaidAction
          kind="image"
          label={image ? 'Nouvelle image' : 'Générer l’image'}
          pendingLabel="Création de l’image…"
          pendingText="On imagine puis on crée ton visuel, entre 30 secondes et une minute."
          confirm={image ? 'L’image actuelle sera remplacée. Continuer ?' : undefined}
          run={() => generateImage(postId, style, instruction.trim())}
          onDone={async () => {
            setInstruction('');
            await onGenerated();
          }}
        />
      </div>
    </div>
  );
}

/** Visuel associé au post : carrousel (HTML/CSS → PDF) ou image d'illustration. */
export function VisualPanel({
  postId,
  plannedFormat,
}: {
  postId: string;
  plannedFormat: string | null;
}) {
  const queryClient = useQueryClient();
  const visuals = useQuery({
    queryKey: ['visuals', postId],
    queryFn: () => fetchVisuals(postId),
  });
  const [tab, setTab] = useState<'carousel' | 'image'>(
    plannedFormat === 'image' ? 'image' : 'carousel',
  );
  const [version, setVersion] = useState(0);

  // Un autre post sélectionné : on revient au format prévu pour lui.
  useEffect(
    () => setTab(plannedFormat === 'image' ? 'image' : 'carousel'),
    [postId, plannedFormat],
  );

  async function reload() {
    await visuals.refetch();
    void queryClient.invalidateQueries({ queryKey: ['asset-url'] });
    setVersion((v) => v + 1);
  }

  return (
    <section
      aria-label="Visuel du post"
      className="space-y-4 rounded-lg border border-slate-200 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Visuel</h3>
        <div
          role="tablist"
          aria-label="Type de visuel"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
        >
          {(
            [
              ['carousel', 'Carrousel'],
              ['image', 'Image'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === value ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visuals.isPending ? (
        <div className="grid place-items-center py-6 text-sky-600" role="status">
          <Spinner className="h-5 w-5" />
          <span className="sr-only">Chargement…</span>
        </div>
      ) : visuals.isError ? (
        <p className="text-sm text-red-700">Impossible de charger le visuel.</p>
      ) : tab === 'carousel' ? (
        visuals.data.carousel ? (
          <CarouselEditor
            key={`${visuals.data.carousel.id}-${version}`}
            initial={visuals.data.carousel}
            postId={postId}
            onRegenerated={reload}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Transforme ce post en carrousel : une idée par diapositive, à publier en PDF sur
              LinkedIn.
            </p>
            <PaidAction
              kind="carousel"
              label="Créer le carrousel"
              pendingLabel="Préparation…"
              pendingText="On découpe ton post en diapositives, quelques secondes."
              run={() => writeCarousel(postId)}
              onDone={reload}
            />
          </div>
        )
      ) : (
        <ImageTab
          key={`${visuals.data.image?.id ?? 'none'}-${version}`}
          postId={postId}
          image={visuals.data.image}
          onGenerated={reload}
        />
      )}
    </section>
  );
}
