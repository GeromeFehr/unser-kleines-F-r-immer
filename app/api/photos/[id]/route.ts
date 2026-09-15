import { bucket, failure, HttpError, viewer } from '@/lib/forever/server';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await viewer(); const { id } = await context.params;
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(id)) throw new HttpError(404, 'Dieses Foto wurde nicht gefunden.');
    const object = await bucket().get(id);
    if (!object) throw new HttpError(404, 'Dieses Foto wurde nicht gefunden.');
    return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch (e) { return failure(e); }
}
