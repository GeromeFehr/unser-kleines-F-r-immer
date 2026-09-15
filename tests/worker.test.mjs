import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare, Log, LogLevel } = wranglerRequire('miniflare');
const serverRoot = path.resolve('dist/server');
function modulesIn(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? modulesIn(path.join(dir, entry.name)) : /\.m?js$/.test(entry.name) ? [{ type: 'ESModule', path: path.join(dir, entry.name) }] : []); }
const builtModules = modulesIn(serverRoot).sort((a,b) => a.path === path.join(serverRoot, 'index.js') ? -1 : b.path === path.join(serverRoot, 'index.js') ? 1 : a.path.localeCompare(b.path));
const mf = new Miniflare({
  name: 'forever-integration-tests', modules: builtModules, modulesRoot: serverRoot,
  compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'],
  d1Databases: ['DB'], r2Buckets: ['BUCKET'],
  bindings: { ADMIN_BOOTSTRAP_EMAIL: 'owner@example.test' },
  assets: { directory: path.resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true, invoke_user_worker_ahead_of_assets: true } },
  log: new Log(LogLevel.ERROR),
});
const origin = 'https://journal.example.test';
const owner = { 'oai-authenticated-user-id': 'fixture-owner', 'oai-authenticated-user-email': 'owner@example.test' };
const visitor = { 'oai-authenticated-user-id': 'fixture-viewer', 'oai-authenticated-user-email': 'viewer@example.test' };
async function call(route, { user = owner, method = 'GET', body, originOverride = origin } = {}) {
  return mf.dispatchFetch(origin + route, { method, headers: { ...user, ...(method !== 'GET' ? { Origin: originOverride, 'Content-Type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
}
try {
  const db = await mf.getD1Database('DB');
  for (const file of fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) {
    for (const sql of fs.readFileSync(path.join('drizzle', file), 'utf8').split('--> statement-breakpoint').filter(s => s.trim())) await db.prepare(sql).run();
  }
  let response = await call('/api/journal', { user: {} }); assert.equal(response.status, 401, await response.text());
  response = await call('/api/journal', { user: visitor }); assert.equal(response.status, 200);
  let journal = await response.json(); assert.equal(journal.isAdmin, false); assert.equal(journal.memories.length, 3);
  response = await call('/api/journal'); assert.equal(response.status, 200); journal = await response.json(); assert.equal(journal.isAdmin, true);
  const draft = { title: 'Fixture memory', date: '2026-09-15', place: 'Hamburg', story: 'Integration test only', category: 'Date', latitude: 53.55, longitude: 10, photoUrl: '', photoAlt: '', isExample: false };
  response = await call('/api/memories', { user: visitor, method: 'POST', body: draft }); assert.equal(response.status, 403);
  response = await call('/api/memories', { method: 'POST', body: draft, originOverride: 'https://other.example' }); assert.equal(response.status, 403);
  response = await call('/api/memories', { method: 'POST', body: { ...draft, latitude: 100 } }); assert.equal(response.status, 400);
  response = await call('/api/memories', { method: 'POST', body: draft }); assert.equal(response.status, 201, await response.clone().text());
  const created = await response.json(); assert.equal(created.revision, 1);
  response = await call('/api/memories/' + created.id, { method: 'PUT', body: { ...draft, revision: 1, title: 'Updated memory' } }); assert.equal(response.status, 200);
  response = await call('/api/memories/' + created.id, { method: 'PUT', body: { ...draft, revision: 1 } }); assert.equal(response.status, 409);
  journal = await (await call('/api/journal')).json(); assert.equal(journal.memories.find(m => m.id === created.id).title, 'Updated memory');
  response = await call('/api/memories/' + created.id, { method: 'DELETE', body: { revision: 1 } }); assert.equal(response.status, 409);
  response = await call('/api/memories/' + created.id, { method: 'DELETE', body: { revision: 2 } }); assert.equal(response.status, 200);
  response = await call('/api/memories/example-alster', { method: 'DELETE', body: { revision: 1 } }); assert.equal(response.status, 200);
  journal = await (await call('/api/journal')).json(); assert.equal(journal.memories.length, 2, 'Deleted example must not be reseeded');
  response = await call('/api/settings', { method: 'PUT', body: { ...journal.settings, firstName: 'New name' } }); assert.equal(response.status, 200);
  journal = await (await call('/api/journal')).json(); assert.equal(journal.settings.firstName, 'New name');
  const form = new FormData();
  form.append('photo', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6X58AAAAASUVORK5CYII=', 'base64')], 'fixture.png', { type: 'image/png' }));
  const uploadRequest = new Request(origin + '/api/upload', { method: 'POST', body: form });
  response = await mf.dispatchFetch(origin + '/api/upload', { method: 'POST', headers: { ...owner, Origin: origin, 'Content-Type': uploadRequest.headers.get('content-type') }, body: Buffer.from(await uploadRequest.arrayBuffer()) });
  assert.equal(response.status, 201, await response.clone().text()); const upload = await response.json();
  response = await call(upload.photoUrl); assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/png');
  response = await call(upload.photoUrl, { user: {} }); assert.equal(response.status, 401);
  response = await call('/'); assert.equal(response.status, 200, await response.clone().text()); const html = await response.text(); assert.ok(html.includes('Unser kleines')); assert.ok(html.includes('Mir ist langweilig'));
  response = await call('/admin'); assert.equal(response.status, 200); const adminHtml = await response.text(); assert.ok(adminHtml.includes('eure Geschichte'));
  console.log('Passed: real Worker SSR, authentication, owner bootstrap, authorization, CSRF, validation, seed-once, create/read/update/delete, conflict protection, settings and private photo upload/read.');
} finally { await mf.dispose(); }
