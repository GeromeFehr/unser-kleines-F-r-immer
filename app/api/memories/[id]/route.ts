import { z } from 'zod';
import { admin, database, failure, HttpError, json, jsonBody, validateStoredPhoto } from '@/lib/forever/server';
import { memorySchema } from '@/lib/forever/validation';
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try {
    await admin(); const { id } = await context.params;
    const { revision, ...m } = memorySchema.extend({ revision: z.number().int().positive() }).parse(await jsonBody(request));
    await validateStoredPhoto(m.photoUrl); const now = new Date().toISOString();
    const result = await database().prepare('UPDATE memories SET title = ?, place = ?, date = ?, story = ?, category = ?, latitude = ?, longitude = ?, photo_url = ?, photo_alt = ?, is_example = ?, updated_at = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(m.title, m.place, m.date, m.story, m.category, m.latitude, m.longitude, m.photoUrl, m.photoAlt, m.isExample ? 1 : 0, now, id, revision).run();
    if (!result.meta.changes) throw new HttpError(409, 'Diese Erinnerung wurde inzwischen geändert oder gelöscht. Sichere deinen Text und lade die Liste neu.');
    return json({ ...m, id, updatedAt: now, revision: revision + 1 });
  } catch (e) { return failure(e); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await admin(); const { id } = await context.params;
    const { revision } = z.object({ revision: z.number().int().positive() }).parse(await jsonBody(request));
    const result = await database().prepare('DELETE FROM memories WHERE id = ? AND revision = ?').bind(id, revision).run();
    if (!result.meta.changes) throw new HttpError(409, 'Diese Erinnerung wurde inzwischen geändert. Bitte lade die Liste neu.');
    return json({ deleted: true });
  } catch (e) { return failure(e); }
}
