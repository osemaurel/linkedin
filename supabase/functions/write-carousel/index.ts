import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { admin, readJson, serve } from '../_shared/http.ts';
import { buildVoiceInput, loadVoice } from '../_shared/post.ts';
import { COSTS } from '../_shared/pricing.ts';
import {
  CAROUSEL_SCHEMA,
  CAROUSEL_SYSTEM_PROMPT,
  loadPost,
  normalizeCarousel,
} from '../_shared/visuals.ts';

const MODEL = 'gpt-5.4-mini';
const THEMES = ['clair', 'sombre', 'couleur'];

/**
 * Texte des diapositives d'un carrousel, tiré du post. Le rendu HTML/CSS et l'export PDF
 * se font dans le navigateur : rien n'est stocké hors de assets.meta.
 */
serve(async (req, { userId }) => {
  const body = await readJson(req);
  const post = await loadPost(userId, body.post_id);
  const voice = await loadVoice(userId);

  const { data: existing, error: existingError } = await admin
    .from('assets')
    .select('id, meta')
    .eq('post_id', post.id)
    .eq('kind', 'carousel');
  if (existingError) throw existingError;
  const previousTheme = (existing[0]?.meta as { theme?: string } | undefined)?.theme;
  const theme = THEMES.includes(previousTheme ?? '') ? previousTheme : 'clair';
  const client = openaiClient();

  const { result } = await tracked(userId, 'carousel', COSTS.carousel, async () => {
    const { data, usage } = await generateJson(client, {
      model: MODEL,
      effort: 'low',
      system: CAROUSEL_SYSTEM_PROMPT,
      user: `${buildVoiceInput(voice)}

<post>
${post.body}
</post>
Angle : ${post.angle ?? '(aucun)'}`,
      schemaName: 'carrousel',
      schema: CAROUSEL_SCHEMA,
    });
    const slides = normalizeCarousel(data);

    // Un seul carrousel par post : le nouveau remplace l'ancien une fois enregistré.
    const { data: asset, error } = await admin
      .from('assets')
      .insert({
        user_id: userId,
        post_id: post.id,
        kind: 'carousel',
        storage_path: '',
        meta: { slides, theme },
      })
      .select('id')
      .single();
    if (error) throw error;
    if (existing.length) {
      await admin
        .from('assets')
        .delete()
        .in(
          'id',
          existing.map((a) => a.id),
        );
    }
    return { result: { assetId: asset.id, slides: slides.length }, usage };
  });

  return { asset_id: result.assetId, slides: result.slides };
});
