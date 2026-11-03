import { generateJson, openaiClient, tracked } from '../_shared/ai.ts';
import { admin, HttpError, readJson, serve } from '../_shared/http.ts';
import { COSTS } from '../_shared/pricing.ts';
import {
  buildImageRequest,
  IMAGE_MODEL,
  IMAGE_PROMPT_SCHEMA,
  IMAGE_PROMPT_SYSTEM,
  IMAGE_STYLES,
  loadPost,
  MAX_IMAGE_INSTRUCTION,
  normalizeImagePrompt,
  type ImageStyle,
} from '../_shared/visuals.ts';

const PROMPT_MODEL = 'gpt-5.4-mini';
const BUCKET = 'assets';

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Image d'illustration d'un post : un prompt écrit à partir du post, puis le modèle
 * d'image. Le fichier va dans le bucket privé assets, lisible par son seul propriétaire.
 */
serve(async (req, { userId }) => {
  const body = await readJson(req);
  const style = (body.style ?? 'photo') as ImageStyle;
  if (!IMAGE_STYLES.includes(style)) throw new HttpError(400, 'bad_request');
  const instruction = typeof body.instruction === 'string' ? body.instruction.trim() : '';
  if (instruction.length > MAX_IMAGE_INSTRUCTION) throw new HttpError(400, 'too_long');
  const post = await loadPost(userId, body.post_id);

  const { data: previous, error: previousError } = await admin
    .from('assets')
    .select('id, storage_path')
    .eq('post_id', post.id)
    .eq('kind', 'image');
  if (previousError) throw previousError;
  const client = openaiClient();

  const { result, balance } = await tracked(userId, 'image', COSTS.image, async () => {
    const { data, usage } = await generateJson(client, {
      model: PROMPT_MODEL,
      effort: 'low',
      system: IMAGE_PROMPT_SYSTEM,
      user: buildImageRequest(post, style, instruction),
      schemaName: 'prompt_image',
      schema: IMAGE_PROMPT_SCHEMA,
    });
    const prompt = normalizeImagePrompt(data, style);

    const image = await client.images.generate({
      model: IMAGE_MODEL,
      prompt,
      size: '1024x1024',
      quality: 'medium',
      output_format: 'jpeg',
      n: 1,
    });
    const b64 = image.data?.[0]?.b64_json;
    if (!b64) throw new Error('image vide');

    const path = `${userId}/${post.id}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, decodeBase64(b64), { contentType: 'image/jpeg' });
    if (uploadError) throw uploadError;

    const { data: asset, error } = await admin
      .from('assets')
      .insert({
        user_id: userId,
        post_id: post.id,
        kind: 'image',
        storage_path: path,
        meta: { style, instruction, prompt, model: IMAGE_MODEL },
      })
      .select('id')
      .single();
    if (error) {
      await admin.storage.from(BUCKET).remove([path]);
      throw error;
    }

    // Une image par post : l'ancienne est retirée une fois la nouvelle enregistrée.
    if (previous.length) {
      await admin
        .from('assets')
        .delete()
        .in(
          'id',
          previous.map((a) => a.id),
        );
      await admin.storage.from(BUCKET).remove(previous.map((a) => a.storage_path).filter(Boolean));
    }

    const imageUsage = image.usage;
    return {
      result: { assetId: asset.id, path },
      usage: {
        tokensIn: usage.tokensIn + (imageUsage?.input_tokens ?? 0),
        tokensOut: usage.tokensOut + (imageUsage?.output_tokens ?? 0),
      },
    };
  });

  return { asset_id: result.assetId, storage_path: result.path, credits_balance: balance };
});
