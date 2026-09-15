import { admin, failure, json, jsonBody, validateStoredPhoto } from '@/lib/forever/server';
import { updateJournal } from '@/lib/forever/storage';
import { memorySchema } from '@/lib/forever/validation';
export async function POST(request: Request) {
  try {
    await admin();
    const m = memorySchema.parse(await jsonBody(request));
    await validateStoredPhoto(m.photoUrl);
    const now = new Date().toISOString();
    const memory = { ...m, id: crypto.randomUUID(), createdAt: now, updatedAt: now, revision: 1 };
    await updateJournal(data => { data.memories.push(memory); });
    return json(memory, 201);
  } catch (e) { return failure(e); }
}
