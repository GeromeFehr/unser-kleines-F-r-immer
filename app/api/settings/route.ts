import { admin, failure, json, jsonBody } from '@/lib/forever/server';
import { updateJournal } from '@/lib/forever/storage';
import { settingsSchema } from '@/lib/forever/validation';
export async function PUT(request: Request) {
  try {
    await admin(); const settings = settingsSchema.parse(await jsonBody(request));
    await updateJournal(data => { data.settings = settings; });
    return json(settings);
  } catch (e) { return failure(e); }
}
