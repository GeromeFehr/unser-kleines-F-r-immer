import { z } from 'zod';
import { admin, failure, HttpError, json, jsonBody, validateStoredPhoto } from '@/lib/forever/server';
import { updateJournal } from '@/lib/forever/storage';
import { memorySchema } from '@/lib/forever/validation';
type Context = { params: Promise<{ id: string }> };
const conflict = () => new HttpError(409, 'Diese Erinnerung wurde inzwischen geändert oder gelöscht. Sichere deinen Text und lade die Liste neu.');
export async function PUT(request: Request, context: Context) {
  try {
    await admin(); const { id } = await context.params;
    const { revision, ...m } = memorySchema.extend({ revision: z.number().int().positive() }).parse(await jsonBody(request));
    await validateStoredPhoto(m.photoUrl);
    const updated = await updateJournal(data => {
      const index = data.memories.findIndex(memory => memory.id === id);
      if (index < 0 || data.memories[index].revision !== revision) throw conflict();
      const memory = { ...data.memories[index], ...m, updatedAt: new Date().toISOString(), revision: revision + 1 };
      data.memories[index] = memory;
      return memory;
    });
    return json(updated);
  } catch (e) { return failure(e); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await admin(); const { id } = await context.params;
    const { revision } = z.object({ revision: z.number().int().positive() }).parse(await jsonBody(request));
    await updateJournal(data => {
      const memory = data.memories.find(item => item.id === id);
      if (!memory || memory.revision !== revision) throw conflict();
      data.memories = data.memories.filter(item => item.id !== id);
    });
    return json({ deleted: true });
  } catch (e) { return failure(e); }
}
