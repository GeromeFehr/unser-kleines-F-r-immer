import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { HttpError } from './errors';
import { journalIsPrivate, SESSION_COOKIE, verifySession } from './password';

export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function viewer() {
  const session = await getSession();
  if (journalIsPrivate() && !session) throw new HttpError(401, 'Bitte öffne euer Zuhause mit dem Passwort.');
  return session;
}
export async function admin() {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Bitte melde dich mit dem Admin-Passwort an.');
  if (session.role !== 'admin') throw new HttpError(403, 'Zum Bearbeiten brauchst du das Admin-Passwort.');
  return session;
}
export async function requireViewer() {
  if (journalIsPrivate() && !await getSession()) redirect('/login?returnTo=%2F');
}
export async function requireAdmin() {
  if ((await getSession())?.role !== 'admin') redirect('/login?returnTo=%2Fadmin');
}
