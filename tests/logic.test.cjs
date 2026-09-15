const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
// Load exactly the TypeScript source used by the app; no duplicate timer or validator logic.
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name);
  new Function('module', 'exports', 'require', js)(module, module.exports, localRequire);
  return module.exports;
}
const { relationshipDuration, startInstant, isValidLocalDate } = load('lib/forever/time.ts');
const { DEFAULT_SETTINGS: base, EXAMPLE_MEMORIES, COMPLIMENTS, SURPRISES } = load('lib/forever/content.ts');
const { memorySchema, settingsSchema } = load('lib/forever/validation.ts');
assert.equal(new Date(startInstant(base)).toISOString(), '2023-10-12T18:00:00.000Z');
assert.deepEqual(relationshipDuration(base, new Date('2026-10-12T18:00:00Z')), { years: 3, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 1096, future: false });
const justBefore = relationshipDuration(base, new Date('2026-10-12T17:59:59Z'));
assert.deepEqual([justBefore.years, justBefore.months, justBefore.days, justBefore.hours, justBefore.minutes, justBefore.seconds], [2, 11, 29, 23, 59, 59]);
const leap = relationshipDuration({ ...base, startLocal: '2024-02-29T20:00:00' }, new Date('2025-02-28T19:00:00Z'));
assert.deepEqual([leap.years, leap.months, leap.days], [1, 0, 0]);
const monthEnd = relationshipDuration({ ...base, startLocal: '2024-01-31T20:00:00' }, new Date('2024-02-29T19:00:00Z'));
assert.deepEqual([monthEnd.years, monthEnd.months, monthEnd.days], [0, 1, 0]);
const dst = relationshipDuration({ ...base, startLocal: '2026-03-28T20:00:00' }, new Date('2026-03-29T18:00:01Z'));
assert.deepEqual([dst.days, dst.hours, dst.minutes, dst.seconds], [1, 0, 0, 1]);
assert.equal(isValidLocalDate('2026-03-29T02:30:00', 'Europe/Berlin'), false);
assert.equal(isValidLocalDate('2026-02-30T20:00:00', 'Europe/Berlin'), false);
assert.equal(relationshipDuration(base, new Date('2020-01-01Z')).future, true);
assert.equal(settingsSchema.safeParse({ ...base, firstName: '' }).success, false);
assert.equal(memorySchema.safeParse(EXAMPLE_MEMORIES[0]).success, true);
for (const patch of [{ latitude: 200 }, { longitude: -200 }, { date: '2026-02-30' }, { photoUrl: 'javascript:alert(1)' }, { photoUrl: 'https://user:pass@example.com/image' }, { story: '' }]) assert.equal(memorySchema.safeParse({ ...EXAMPLE_MEMORIES[0], ...patch }).success, false);
assert.equal(COMPLIMENTS.length, 24); assert.equal(SURPRISES.length, 18);
assert.equal(new Set(COMPLIMENTS).size, 24); assert.equal(new Set(SURPRISES.map(x => x.title)).size, 18);
console.log('Passed: timezone, anniversary boundary, leap day, month end, DST, future start, inputs, image URLs and example content.');
