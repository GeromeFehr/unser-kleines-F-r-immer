import { z } from 'zod';
import { CATEGORIES } from './types';
import { isValidLocalDate } from './time';
export function safePhotoUrl(value: string): boolean {
  if (!value) return true;
  if (/^\/api\/photos\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(value)) return true;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
export const memorySchema = z.object({
  title: z.string().trim().min(1, 'Bitte gib deiner Erinnerung einen Titel.').max(100),
  place: z.string().trim().min(1, 'Bitte gib einen Ortsnamen ein.').max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d => { const parsed = new Date(d + 'T12:00:00Z'); return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d && d >= '1900-01-01' && d <= '2200-12-31'; }, 'Bitte gib ein gültiges Datum ein.'),
  story: z.string().trim().min(1, 'Schreibe ein paar Worte zu diesem Moment.').max(3000),
  category: z.enum(CATEGORIES), latitude: z.number().finite().min(-85).max(85), longitude: z.number().finite().min(-180).max(180),
  photoUrl: z.string().trim().max(2048).refine(safePhotoUrl, 'Bitte verwende einen sicheren HTTPS-Bildlink oder lade ein Foto hoch.'),
  photoAlt: z.string().trim().max(300), isExample: z.boolean(),
});
export const settingsSchema = z.object({
  firstName: z.string().trim().min(1).max(50), secondName: z.string().trim().min(1).max(50),
  startLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/),
  timeZone: z.enum(['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'UTC']),
}).refine(s => isValidLocalDate(s.startLocal, s.timeZone), 'Dieses Datum oder diese Uhrzeit existiert in der gewählten Zeitzone nicht.');
