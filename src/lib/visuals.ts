import { invokeFunction } from './edgeFunctions';
import { supabase } from './supabase';

export type Slide = { title: string; body: string };
export type ThemeId = 'clair' | 'sombre' | 'couleur';
export type ImageStyle = 'photo' | 'illustration';

export const THEMES: {
  id: ThemeId;
  label: string;
  bg: string;
  text: string;
  accent: string;
  muted: string;
}[] = [
  {
    id: 'clair',
    label: 'Clair',
    bg: '#ffffff',
    text: '#0f172a',
    accent: '#0284c7',
    muted: '#64748b',
  },
  {
    id: 'sombre',
    label: 'Sombre',
    bg: '#0f172a',
    text: '#f8fafc',
    accent: '#38bdf8',
    muted: '#94a3b8',
  },
  {
    id: 'couleur',
    label: 'Couleur',
    bg: '#0369a1',
    text: '#ffffff',
    accent: '#fde047',
    muted: '#bae6fd',
  },
];

/** Format portrait 4:5, celui qui occupe le plus de place dans le fil LinkedIn. */
export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

export type Carousel = { id: string; slides: Slide[]; theme: ThemeId };
export type PostImage = { id: string; path: string; style: ImageStyle };
export type PostVisuals = { carousel: Carousel | null; image: PostImage | null };

const ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

export async function fetchVisuals(postId: string): Promise<PostVisuals> {
  const { data, error } = await supabase
    .from('assets')
    .select('id, kind, storage_path, meta, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const carousel = data.find((a) => a.kind === 'carousel');
  const image = data.find((a) => a.kind === 'image' && a.storage_path);
  const cMeta = (carousel?.meta ?? {}) as { slides?: Slide[]; theme?: ThemeId };
  const iMeta = (image?.meta ?? {}) as { style?: ImageStyle };
  return {
    carousel: carousel
      ? {
          id: carousel.id,
          slides: Array.isArray(cMeta.slides) ? cMeta.slides : [],
          theme: THEMES.some((t) => t.id === cMeta.theme) ? (cMeta.theme as ThemeId) : 'clair',
        }
      : null,
    image: image ? { id: image.id, path: image.storage_path, style: iMeta.style ?? 'photo' } : null,
  };
}

export async function saveCarousel(carousel: Carousel) {
  const { error } = await supabase
    .from('assets')
    .update({ meta: { slides: carousel.slides, theme: carousel.theme } })
    .eq('id', carousel.id);
  if (error) throw new Error(ERROR);
}

export function writeCarousel(postId: string) {
  return invokeFunction<{ asset_id: string; slides: number }>(
    'write-carousel',
    { post_id: postId },
    {
      insufficient_credits: 'Ton solde ne couvre pas ce carrousel.',
      post_not_found: 'Ce post n’existe plus. Recharge la page.',
      post_empty: 'Le post est vide : écris-le d’abord.',
      llm_not_configured: 'Service momentanément indisponible. Réessaie plus tard.',
      llm_failed: 'Le carrousel n’a pas abouti. Réessaie dans un instant.',
    },
  );
}

export function generateImage(postId: string, style: ImageStyle, instruction: string) {
  return invokeFunction<{ asset_id: string; storage_path: string; credits_balance: number }>(
    'generate-image',
    { post_id: postId, style, instruction: instruction || null },
    {
      insufficient_credits: 'Ton solde ne couvre pas cette image.',
      too_long: 'Une ou deux phrases suffisent pour la consigne.',
      post_not_found: 'Ce post n’existe plus. Recharge la page.',
      post_empty: 'Le post est vide : écris-le d’abord.',
      llm_not_configured: 'Service momentanément indisponible. Réessaie plus tard.',
      llm_failed: 'L’image n’a pas abouti. Aucun crédit n’a été débité : tu peux relancer.',
    },
  );
}

/** Lien temporaire vers un visuel du bucket privé (lisible par son seul propriétaire). */
export async function signedUrl(path: string, download?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('assets')
    .createSignedUrl(path, 3600, download ? { download } : undefined);
  if (error || !data) throw new Error(ERROR);
  return data.signedUrl;
}

/**
 * Chaque diapositive, rendue en HTML/CSS à sa taille réelle, devient une page du PDF.
 * Les deux bibliothèques ne sont chargées qu'au moment de l'export.
 */
export async function exportCarouselPdf(nodes: HTMLElement[], filename: string) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  const pdf = new jsPDF({ unit: 'pt', format: [SLIDE_WIDTH, SLIDE_HEIGHT], compress: true });
  for (const [i, node] of nodes.entries()) {
    const data = await toJpeg(node, {
      quality: 0.92,
      pixelRatio: 1,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      cacheBust: true,
    });
    if (i > 0) pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT]);
    pdf.addImage(data, 'JPEG', 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
  }
  pdf.save(filename);
}
