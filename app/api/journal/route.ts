import { database, ensureJournal, failure, getSettings, isAdmin, json, memoryColumns, normalizeMemory, viewer } from '@/lib/forever/server';
import type { Memory } from '@/lib/forever/types';
export async function GET() {
  try {
    const user = await viewer(); await ensureJournal();
    const [rows, settings, allowed] = await Promise.all([
      database().prepare(`SELECT ${memoryColumns} FROM memories ORDER BY date DESC, created_at DESC`).all<Memory>(),
      getSettings(), isAdmin(user),
    ]);
    return json({ memories: rows.results.map(normalizeMemory), settings, isAdmin: allowed });
  } catch (e) { return failure(e); }
}
