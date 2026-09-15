const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { randomBytes } = require('node:crypto');
const mod = { exports: {} };
const js = ts.transpileModule(fs.readFileSync('lib/forever/password.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('module', 'exports', 'require', js)(mod, mod.exports, require);
const auth = mod.exports;
const previous = { admin: process.env.ADMIN_PASSWORD, journal: process.env.JOURNAL_PASSWORD };
try {
  delete process.env.ADMIN_PASSWORD; delete process.env.JOURNAL_PASSWORD;
  assert.equal(auth.adminConfigured(), false);
  assert.equal(auth.checkPassword('anything'), null);
  process.env.ADMIN_PASSWORD = 'short';
  assert.equal(auth.adminConfigured(), false);
  process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex');
  process.env.JOURNAL_PASSWORD = randomBytes(24).toString('hex');
  assert.equal(auth.checkPassword(process.env.ADMIN_PASSWORD), 'admin');
  assert.equal(auth.checkPassword(process.env.JOURNAL_PASSWORD), 'viewer');
  assert.equal(auth.checkPassword('incorrect'), null);
  const token = auth.createSession('admin', 1000000);
  assert.equal(auth.verifySession(token, 1000001).role, 'admin');
  assert.equal(auth.verifySession(token + 'x', 1000001), null);
  assert.equal(auth.verifySession(token, 1000000 + auth.SESSION_SECONDS * 1000), null);
  const [payload, signature] = token.split('.');
  const changed = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), role: 'viewer' })).toString('base64url');
  assert.equal(auth.verifySession(changed + '.' + signature, 1000001), null);
  process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex');
  assert.equal(auth.verifySession(token, 1000001), null);
  for (const value of ['//evil.example', 'https://evil.example', '/admin?next=evil', '/\\evil.example']) assert.equal(auth.safeReturnTo(value), '/admin');
  assert.equal(auth.safeReturnTo('/'), '/');
  assert.equal(auth.safeReturnTo('/admin'), '/admin');
  console.log('Passed: password roles, missing configuration, forged/expired sessions, rotation and safe redirects.');
} finally {
  for (const [key, value] of [['ADMIN_PASSWORD', previous.admin], ['JOURNAL_PASSWORD', previous.journal]]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
