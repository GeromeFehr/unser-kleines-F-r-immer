import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/forever/password';
import { checkOrigin, failure } from '@/lib/forever/server';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const response = NextResponse.json({ loggedOut: true }, { headers: { 'Cache-Control': 'private, no-store' } });
    response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NETLIFY === 'true' || new URL(request.url).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 0 });
    return response;
  } catch (e) { return failure(e); }
}
