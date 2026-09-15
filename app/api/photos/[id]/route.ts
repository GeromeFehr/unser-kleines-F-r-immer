import { photoStore } from '@/lib/forever/storage';
export const dynamic = 'force-dynamic';
import { failure, HttpError, viewer } from '@/lib/forever/server';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await viewer(); const { id } = await context.params;
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(id)) throw new HttpError(404, 'Dieses Foto wurde nicht gefunden.');
    const object = await photoStore().getWithMetadata(id, { type: 'arrayBuffer' });
    if (!object) throw new HttpError(404, 'Dieses Foto wurde nicht gefunden.');
    return new Response(object.data, { headers: { 'Content-Type': String(object.metadata.contentType || 'application/octet-stream'), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (e) { return failure(e); }
}
