import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type Role = 'admin' | 'viewer';
export type Session = { role: Role; expires: number };
export const SESSION_COOKIE = 'forever_session';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
const MIN_PASSWORD = 12;

function configuredPassword(role: Role): string | null {
  const value = role === 'admin' ? process.env.ADMIN_PASSWORD : process.env.JOURNAL_PASSWORD;
  return value && value.trim().length >= MIN_PASSWORD ? value : null;
}
export function adminConfigured() { return configuredPassword('admin') !== null; }
export function journalIsPrivate() { return Boolean(process.env.JOURNAL_PASSWORD); }
function digest(value: string) { return createHash('sha256').update(value).digest(); }
export function checkPassword(password: string): Role | null {
  if (!adminConfigured() || password.length > 1024) return null;
  const candidate = digest(password);
  const owner = configuredPassword('admin');
  const guest = configuredPassword('viewer');
  const isOwner = timingSafeEqual(candidate, digest(owner || randomBytes(32).toString('hex')));
  const isGuest = timingSafeEqual(candidate, digest(guest || randomBytes(32).toString('hex')));
  return isOwner ? 'admin' : isGuest ? 'viewer' : null;
}
function signingKey() {
  const owner = configuredPassword('admin');
  if (!owner) return null;
  // Both passwords participate, so changing either invalidates old sessions.
  return createHash('sha256').update(JSON.stringify(['forever-session-v1', owner, process.env.JOURNAL_PASSWORD || ''])).digest();
}
export function createSession(role: Role, now = Date.now()): string {
  const key = signingKey();
  if (!key) throw new Error('ADMIN_PASSWORD is not configured');
  const payload = Buffer.from(JSON.stringify({ role, expires: Math.floor(now / 1000) + SESSION_SECONDS, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return payload + '.' + createHmac('sha256', key).update(payload).digest('base64url');
}
export function verifySession(value: string | undefined, now = Date.now()): Session | null {
  const key = signingKey();
  if (!key || !value || value.length > 1024) return null;
  const parts = value.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;
  const expected = createHmac('sha256', key).update(parts[0]).digest();
  const actual = Buffer.from(parts[1], 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!['admin', 'viewer'].includes(session.role) || !Number.isSafeInteger(session.expires) || session.expires <= Math.floor(now / 1000)) return null;
    return { role: session.role, expires: session.expires };
  } catch { return null; }
}
export function safeReturnTo(value: unknown, fallback = '/admin') {
  return typeof value === 'string' && /^\/(?:admin)?$/.test(value) ? value : fallback;
}
