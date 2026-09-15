import assert from 'node:assert/strict';
import { BlobsServer } from '@netlify/blobs/server';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';

const directory = await mkdtemp(join(tmpdir(), 'forever-blobs-'));
const token = randomBytes(32).toString('hex');
const blobs = new BlobsServer({ directory, token });
const { address } = await blobs.start();
const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const context = Buffer.from(JSON.stringify({ siteID: 'forever-test', token, apiURL: address, edgeURL: address, uncachedEdgeURL: address })).toString('base64');
const password = randomBytes(24).toString('hex'), viewerPassword = randomBytes(24).toString('hex');
let child, logs = '';
async function start() {
  child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { env: { ...process.env, ADMIN_PASSWORD: password, JOURNAL_PASSWORD: viewerPassword, NETLIFY_BLOBS_CONTEXT: context }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', chunk => { logs += chunk; process.stdout.write(chunk); }); child.stderr.on('data', chunk => { logs += chunk; process.stdout.write(chunk); });
  for (let i = 0; i < 160; i++) {
    if (child.exitCode !== null) throw new Error('Next.js exited: ' + logs);
    try { if ((await fetch(base + '/login', { signal: AbortSignal.timeout(2000) })).status === 200) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Next.js did not become ready: ' + logs);
}
async function stop() { if (child && child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); } }
async function request(path, { method = 'GET', body, cookie, origin = base, headers = {} } = {}) {
  console.log(method, path);
  return fetch(base + path, { signal: AbortSignal.timeout(15000), method, redirect: 'manual', headers: { ...(method !== 'GET' ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
}
try {
  await start();
  assert.equal((await request('/')).status, 307);
  assert.equal((await request('/admin')).status, 307);
  assert.equal((await request('/api/journal')).status, 401);
  assert.equal((await request('/api/journal', { headers: { 'oai-authenticated-user-id': 'fake', 'oai-authenticated-user-email': 'owner@example.com' } })).status, 401);
  assert.equal((await request('/api/auth/login', { method: 'POST', body: { password }, origin: 'https://other.example' })).status, 403);
  assert.equal((await request('/api/auth/login', { method: 'POST', body: { password: 'wrong' } })).status, 401);
  const login = await request('/api/auth/login', { method: 'POST', body: { password, returnTo: '//evil.example' } });
  assert.equal(login.status, 200); assert.equal((await login.json()).returnTo, '/admin');
  assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(login.headers.get('set-cookie'), /SameSite=Lax/i);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/admin', { cookie })).status, 200);
  const journal = await (await request('/api/journal', { cookie })).json();
  assert.equal(journal.memories.length, 3); assert.equal(journal.isAdmin, true);
  const draft = { ...journal.memories[0], title: 'Integrationstest', isExample: false };
  const createdResponse = await request('/api/memories', { method: 'POST', cookie, body: draft });
  assert.equal(createdResponse.status, 201); const created = await createdResponse.json();
  const endpoint = '/api/memories/' + created.id;
  assert.equal((await request(endpoint, { method: 'PUT', cookie, body: { ...created, title: 'Gespeichert' } })).status, 200);
  assert.equal((await request(endpoint, { method: 'PUT', cookie, body: created })).status, 409);
  assert.equal((await request('/api/memories', { method: 'POST', cookie, body: { ...draft, latitude: 400 } })).status, 400);
  assert.equal((await request('/api/memories', { method: 'POST', body: draft })).status, 401);
  const form = new FormData();
  form.set('photo', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0VsAAAAASUVORK5CYII=', 'base64')], 'pixel.png', { type: 'image/png' }));
  const uploaded = await request('/api/upload', { method: 'POST', cookie, body: form });
  assert.equal(uploaded.status, 201); const { photoUrl } = await uploaded.json();
  assert.equal((await request(photoUrl)).status, 401);
  const photo = await request(photoUrl, { cookie }); assert.equal(photo.status, 200); assert.equal(photo.headers.get('content-type'), 'image/png');
  const savedPhoto = await request(endpoint, { method: 'PUT', cookie, body: { ...created, photoUrl, revision: 2 } }); assert.equal(savedPhoto.status, 200);
  const guest = await request('/api/auth/login', { method: 'POST', body: { password: viewerPassword } });
  assert.equal(guest.status, 200); const guestCookie = guest.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/journal', { cookie: guestCookie })).status, 200);
  assert.equal((await request('/api/memories', { method: 'POST', cookie: guestCookie, body: draft })).status, 403);
  const settings = { ...journal.settings, firstName: 'Testname' };
  assert.equal((await request('/api/settings', { method: 'PUT', cookie, body: settings })).status, 200);
  for (const memory of [...journal.memories, { ...created, revision: 3 }]) assert.equal((await request('/api/memories/' + memory.id, { method: 'DELETE', cookie, body: { revision: memory.revision } })).status, 200);
  await stop(); await start();
  const persisted = await (await request('/api/journal', { cookie })).json();
  assert.equal(persisted.memories.length, 0); assert.equal(persisted.settings.firstName, 'Testname');
  assert.equal((await request(photoUrl, { cookie })).status, 200);
  const logout = await request('/api/auth/logout', { method: 'POST', cookie }); assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  for (let i = 0; i < 7; i++) assert.equal((await request('/api/auth/login', { method: 'POST', body: { password: 'wrong' } })).status, 401);
  assert.equal((await request('/api/auth/login', { method: 'POST', body: { password } })).status, 429);
  console.log('Passed: real Next.js production server, access control, login, CSRF, CRUD, conflicts, images, settings, persistence across restart, no re-seeding, logout and login throttling.');
} catch (error) { console.error(logs); throw error; }
finally { await stop(); await blobs.stop(); await rm(directory, { recursive: true, force: true }); }
