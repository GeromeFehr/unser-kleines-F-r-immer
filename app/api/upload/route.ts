import { admin, bucket, checkOrigin, database, failure, HttpError, json, readLimited } from '@/lib/forever/server';
export async function POST(request: Request) {
  try {
    const user = await admin(); checkOrigin(request);
    const type = request.headers.get('content-type') || '';
    if (!type.startsWith('multipart/form-data')) throw new HttpError(415, 'Bitte wähle eine Bilddatei aus.');
    const bytes = await readLimited(request, 9 * 1024 * 1024);
    const form = await new Response(bytes, { headers: { 'Content-Type': type } }).formData();
    const file = form.get('photo');
    if (!(file instanceof File) || file.size > 8 * 1024 * 1024 || file.size < 12) throw new HttpError(400, 'Bitte wähle ein Foto mit maximal 8 MB aus.');
    const data = new Uint8Array(await file.arrayBuffer());
    const jpeg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    const png = [137,80,78,71,13,10,26,10].every((v,i) => data[i] === v);
    const webp = new TextDecoder().decode(data.slice(0,4)) === 'RIFF' && new TextDecoder().decode(data.slice(8,12)) === 'WEBP';
    if (!jpeg && !png && !webp) throw new HttpError(415, 'Bitte lade ein JPG-, PNG- oder WebP-Foto hoch.');
    const extension = jpeg ? 'jpg' : png ? 'png' : 'webp';
    const contentType = jpeg ? 'image/jpeg' : png ? 'image/png' : 'image/webp';
    const id = crypto.randomUUID() + '.' + extension;
    await bucket().put(id, data, { httpMetadata: { contentType } });
    try { await database().prepare('INSERT INTO photos (id, content_type, uploaded_by, created_at) VALUES (?, ?, ?, ?)').bind(id, contentType, user.userId, new Date().toISOString()).run(); }
    catch (e) { await bucket().delete(id); throw e; }
    return json({ photoUrl: '/api/photos/' + id }, 201);
  } catch (e) { return failure(e); }
}
