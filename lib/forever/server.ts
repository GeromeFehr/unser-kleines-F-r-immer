import { ZodError } from 'zod';
import { HttpError } from './errors';
export { HttpError } from './errors';
export { admin, viewer } from './auth';
export { validateStoredPhoto } from './storage';
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  // Next.js may normalize request.url to localhost behind an adapter. Host
  // retains the request's public host; never trust a caller's forwarded host.
  const host = request.headers.get('host') || new URL(request.url).host;
  let valid = false;
  try {
    const source = new URL(origin || '');
    valid = source.origin === origin && source.host === host &&
      (source.protocol === 'https:' || (process.env.NETLIFY !== 'true' && source.protocol === 'http:'));
  } catch { /* An absent or malformed Origin is rejected. */ }
  if (!valid) throw new HttpError(403, 'Diese Anfrage ist nicht erlaubt. Bitte lade die Seite neu.');
}
export async function readLimited(request: Request, limit = 24000) {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new HttpError(413, 'Die Datei oder Eingabe ist zu groß.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Die Eingabe fehlt.');
  const parts: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); throw new HttpError(413, 'Die Datei oder Eingabe ist zu groß.'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let pos = 0;
  for (const part of parts) { bytes.set(part, pos); pos += part.byteLength; }
  return bytes;
}
export async function jsonBody(request: Request) {
  checkOrigin(request);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Ungültiges Datenformat.');
  try { return JSON.parse(new TextDecoder().decode(await readLimited(request))); }
  catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(400, 'Die Eingabe konnte nicht gelesen werden.'); }
}
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  if (error instanceof ZodError) return json({ error: error.issues[0]?.message || 'Bitte prüfe deine Eingaben.' }, 400);
  console.error('Journal request failed', error instanceof Error ? error.message : 'Unknown storage error');
  return json({ error: 'Die Erinnerungen sind gerade nicht erreichbar. Deine Eingaben bleiben erhalten. Bitte versuche es gleich noch einmal.' }, 503);
}
