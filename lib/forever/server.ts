import { env } from 'cloudflare:workers';
import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';
import { DEFAULT_SETTINGS, EXAMPLE_MEMORIES } from './content';
import type { Memory, CoupleSettings } from './types';
import { ZodError } from 'zod';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function database() {
  if (!env.DB) throw new Error('DB binding unavailable');
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET) throw new Error('BUCKET binding unavailable');
  return env.BUCKET;
}
export async function viewer() {
  const user = await getChatGPTUser();
  if (!user) throw new HttpError(401, 'Bitte melde dich erneut an.');
  return user;
}
export async function isAdmin(user: ChatGPTUser) {
  const db = database();
  let owner = await db.prepare('SELECT user_id FROM admins WHERE role = ?').bind('owner').first<{ user_id: string }>();
  // One-time bootstrap only from the verified platform identity matching the runtime allowlist.
  // Thereafter authorization is exclusively bound to the stable, Site-specific user ID.
  const bootstrap = env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (!owner && bootstrap && user.email.trim().toLowerCase() === bootstrap) {
    await db.prepare('INSERT OR IGNORE INTO admins (role, user_id) VALUES (?, ?)').bind('owner', user.userId).run();
    owner = await db.prepare('SELECT user_id FROM admins WHERE role = ?').bind('owner').first<{ user_id: string }>();
  }
  return owner?.user_id === user.userId;
}
export async function admin() {
  const user = await viewer();
  if (!await isAdmin(user)) throw new HttpError(403, 'Die Verwaltung ist nur für den Besitzer freigegeben.');
  return user;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) throw new HttpError(403, 'Diese Anfrage ist nicht erlaubt. Bitte lade die Seite neu.');
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
export const memoryColumns = 'id, title, place, date, story, category, latitude, longitude, photo_url AS photoUrl, photo_alt AS photoAlt, is_example AS isExample, created_at AS createdAt, updated_at AS updatedAt, revision';
export function normalizeMemory(row: Memory): Memory { return { ...row, isExample: Boolean(row.isExample) }; }
export async function ensureJournal() {
  const db = database();
  const seeded = await db.prepare('SELECT value FROM app_state WHERE key = ?').bind('initialized').first();
  if (seeded) return;
  const statements = EXAMPLE_MEMORIES.map(m => db.prepare('INSERT OR IGNORE INTO memories (id, title, place, date, story, category, latitude, longitude, photo_url, photo_alt, is_example, created_at, updated_at, revision) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM app_state WHERE key = ?)').bind(m.id, m.title, m.place, m.date, m.story, m.category, m.latitude, m.longitude, m.photoUrl, m.photoAlt, 1, m.createdAt, m.updatedAt, 1, 'initialized'));
  statements.push(db.prepare('INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)').bind('settings', JSON.stringify(DEFAULT_SETTINGS)));
  statements.push(db.prepare('INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)').bind('initialized', '1'));
  await db.batch(statements);
}
export async function getSettings(): Promise<CoupleSettings> {
  const row = await database().prepare('SELECT value FROM app_state WHERE key = ?').bind('settings').first<{ value: string }>();
  return row ? JSON.parse(row.value) : DEFAULT_SETTINGS;
}
export async function validateStoredPhoto(url: string) {
  if (!url.startsWith('/api/photos/')) return;
  const photo = await database().prepare('SELECT id FROM photos WHERE id = ?').bind(url.split('/').pop()).first();
  if (!photo) throw new HttpError(400, 'Das hochgeladene Foto wurde nicht gefunden. Bitte lade es erneut hoch.');
}
