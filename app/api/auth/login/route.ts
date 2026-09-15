import { NextResponse } from 'next/server';
import { adminConfigured, checkPassword, createSession, safeReturnTo, SESSION_COOKIE, SESSION_SECONDS } from '@/lib/forever/password';
import { failure, HttpError, jsonBody } from '@/lib/forever/server';
import { limitLogin } from '@/lib/forever/storage';
export async function POST(request: Request) {
  try {
    const body = await jsonBody(request);
    if (!adminConfigured()) throw new HttpError(503, 'Das Admin-Passwort wurde noch nicht eingerichtet.');
    if (!body || typeof body.password !== 'string' || !body.password || body.password.length > 1024) throw new HttpError(400, 'Bitte gib dein Passwort ein.');
    await limitLogin(request);
    const role = checkPassword(body.password);
    if (!role) throw new HttpError(401, 'Das Passwort stimmt leider nicht. Bitte versuche es noch einmal.');
    const returnTo = role === 'admin' ? safeReturnTo(body.returnTo) : '/';
    const response = NextResponse.json({ returnTo }, { headers: { 'Cache-Control': 'private, no-store' } });
    response.cookies.set(SESSION_COOKIE, createSession(role), { httpOnly: true, secure: process.env.NETLIFY === 'true' || new URL(request.url).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS });
    return response;
  } catch (e) { return failure(e); }
}
