import 'server-only';
import { getStore } from '@netlify/blobs';
import { createHmac } from 'node:crypto';
import { DEFAULT_SETTINGS, EXAMPLE_MEMORIES } from './content';
import { HttpError } from './errors';
import type { CoupleSettings, Memory } from './types';

type StoredJournal = { version: 1; memories: Memory[]; settings: CoupleSettings };
function store(name: string) {
  return getStore({ name: `forever-${process.env.FOREVER_STORE_SCOPE || 'production'}-${name}`, consistency: 'strong' });
}
export const photoStore = () => store('photos');

async function snapshot() {
  const db = store('journal');
  let entry = await db.getWithMetadata('journal', { type: 'json' });
  if (!entry) {
    const initial: StoredJournal = { version: 1, memories: EXAMPLE_MEMORIES, settings: DEFAULT_SETTINGS };
    await db.setJSON('journal', initial, { onlyIfNew: true });
    entry = await db.getWithMetadata('journal', { type: 'json' });
  }
  if (!entry || entry.data?.version !== 1 || !Array.isArray(entry.data.memories) || !entry.data.settings) throw new Error('Journal data unavailable');
  return { db, data: entry.data as StoredJournal, etag: entry.etag };
}
export async function readJournal() {
  const { data } = await snapshot();
  return { ...data, memories: [...data.memories].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)) };
}
export async function updateJournal<T>(change: (data: StoredJournal) => T): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { db, data, etag } = await snapshot();
    const result = change(data);
    const written = await db.setJSON('journal', data, { onlyIfMatch: etag });
    if (written.modified) return result;
  }
  throw new HttpError(409, 'Gerade wurde etwas anderes gespeichert. Bitte versuche es noch einmal.');
}
export async function validateStoredPhoto(url: string) {
  if (!url.startsWith('/api/photos/')) return;
  if (!await photoStore().getMetadata(url.split('/').pop()!)) throw new HttpError(400, 'Das Foto wurde nicht gefunden. Bitte lade es erneut hoch.');
}

// Persisted and conditional: parallel/serverless requests cannot reset the limit.
// Keep one expiring window per hashed address, without storing IP addresses.
export async function limitLogin(request: Request, now = Date.now()) {
  const address = process.env.NETLIFY === 'true'
    ? request.headers.get('x-nf-client-connection-ip') || 'unknown'
    : 'local';
  const key = createHmac('sha256', process.env.ADMIN_PASSWORD || 'unconfigured').update(address).digest('hex');
  const db = store('login-limits');
  for (let attempt = 0; attempt < 8; attempt++) {
    const entry = await db.getWithMetadata(key, { type: 'json' });
    const previous = entry?.data as { count: number; until: number } | undefined;
    const window = previous && previous.until > now ? previous : { count: 0, until: now + 15 * 60 * 1000 };
    if (window.count >= 10) throw new HttpError(429, 'Zu viele Versuche. Bitte warte bis zu 15 Minuten und versuche es dann erneut.');
    const result = await db.setJSON(key, { count: window.count + 1, until: window.until }, entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true });
    if (result.modified) return;
  }
  throw new HttpError(429, 'Bitte warte einen Moment, bevor du es erneut versuchst.');
}
