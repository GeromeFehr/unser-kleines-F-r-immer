import { admin, database, ensureJournal, failure, json, jsonBody, validateStoredPhoto } from '@/lib/forever/server';
import { memorySchema } from '@/lib/forever/validation';
export async function POST(request: Request) {
  try {
    await admin(); const m = memorySchema.parse(await jsonBody(request)); await ensureJournal(); await validateStoredPhoto(m.photoUrl);
    const now = new Date().toISOString(); const id = crypto.randomUUID();
    await database().prepare('INSERT INTO memories (id, title, place, date, story, category, latitude, longitude, photo_url, photo_alt, is_example, created_at, updated_at, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, m.title, m.place, m.date, m.story, m.category, m.latitude, m.longitude, m.photoUrl, m.photoAlt, m.isExample ? 1 : 0, now, now, 1).run();
    return json({ ...m, id, createdAt: now, updatedAt: now, revision: 1 }, 201);
  } catch (e) { return failure(e); }
}
