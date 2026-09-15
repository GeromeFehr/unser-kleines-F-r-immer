import { failure, json, viewer } from '@/lib/forever/server';
import { readJournal } from '@/lib/forever/storage';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const session = await viewer();
    const { memories, settings } = await readJournal();
    return json({ memories, settings, isAdmin: session?.role === 'admin' });
  } catch (e) { return failure(e); }
}
