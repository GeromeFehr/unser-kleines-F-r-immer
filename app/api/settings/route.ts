import { admin, database, ensureJournal, failure, json, jsonBody } from '@/lib/forever/server';
import { settingsSchema } from '@/lib/forever/validation';
export async function PUT(request: Request) {
  try {
    await admin(); const settings = settingsSchema.parse(await jsonBody(request)); await ensureJournal();
    await database().prepare('UPDATE app_state SET value = ? WHERE key = ?').bind(JSON.stringify(settings), 'settings').run();
    return json(settings);
  } catch (e) { return failure(e); }
}
