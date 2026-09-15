import type { CoupleSettings } from './types';
type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };
const formatters = new Map<string, Intl.DateTimeFormat>();
function partsAt(date: Date, timeZone: string): Parts {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    formatters.set(timeZone, formatter);
  }
  return Object.fromEntries(formatter.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)])) as Parts;
}
function asUtc(p: Parts) { return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second); }
function parseLocal(value: string): Parts {
  const [year, month, day, hour, minute, second = 0] = value.split(/[-T:]/).map(Number);
  return { year, month, day, hour, minute, second };
}
function instant(p: Parts, zone: string): number {
  const target = asUtc(p);
  let result = target;
  for (let i = 0; i < 4; i++) {
    const offset = asUtc(partsAt(new Date(result), zone)) - target;
    if (!offset) break;
    result -= offset;
  }
  return result;
}
export function startInstant(settings: CoupleSettings): number { return instant(parseLocal(settings.startLocal), settings.timeZone); }
export function isValidLocalDate(value: string, zone: string): boolean {
  try {
    const p = parseLocal(value);
    if (p.year < 1900 || p.year > 2200 || p.month < 1 || p.month > 12 || p.day < 1 || p.day > 31 || p.hour < 0 || p.hour > 23 || p.minute < 0 || p.minute > 59 || p.second < 0 || p.second > 59) return false;
    const actual = partsAt(new Date(instant(p, zone)), zone);
    return Object.keys(p).every(key => p[key as keyof Parts] === actual[key as keyof Parts]);
  } catch { return false; }
}
function addMonths(p: Parts, count: number): Parts {
  const d = new Date(Date.UTC(p.year, p.month - 1 + count, 1));
  return { ...p, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: Math.min(p.day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()) };
}
function addDays(p: Parts, days: number): Parts {
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return { ...p, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
export function relationshipDuration(settings: CoupleSettings, now: Date = new Date()) {
  const start = parseLocal(settings.startLocal), zone = settings.timeZone;
  const from = instant(start, zone), to = Math.floor(now.getTime() / 1000) * 1000;
  if (to < from) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, future: true };
  const current = partsAt(new Date(to), zone);
  let years = Math.max(0, current.year - start.year);
  if (instant(addMonths(start, years * 12), zone) > to) years--;
  let months = 0;
  while (months < 11 && instant(addMonths(start, years * 12 + months + 1), zone) <= to) months++;
  let anchor = addMonths(start, years * 12 + months);
  let days = Math.floor((Date.UTC(current.year, current.month - 1, current.day) - Date.UTC(anchor.year, anchor.month - 1, anchor.day)) / 86400000);
  if (instant(addDays(anchor, days), zone) > to) days--;
  anchor = addDays(anchor, days);
  const remaining = Math.max(0, Math.floor((to - instant(anchor, zone)) / 1000));
  return { years, months, days, hours: Math.floor(remaining / 3600), minutes: Math.floor(remaining / 60) % 60, seconds: remaining % 60, totalDays: Math.floor((to - from) / 86400000), future: false };
}
export function anniversary(settings: CoupleSettings, now: Date = new Date()) {
  const start = parseLocal(settings.startLocal), year = partsAt(now, settings.timeZone).year;
  let count = Math.max(1, year - start.year);
  let next = instant(addMonths(start, count * 12), settings.timeZone);
  if (next < now.getTime()) { count++; next = instant(addMonths(start, count * 12), settings.timeZone); }
  return { number: count, days: Math.max(0, Math.ceil((next - now.getTime()) / 86400000)) };
}
export function formatMemoryDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
}
export function formatStart(settings: CoupleSettings) {
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: settings.timeZone }).format(startInstant(settings));
}
