import type { Memory } from './types';
type ModelTool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
type ModelContext = { registerTool: (tool: ModelTool, options: { signal: AbortSignal }) => void | Promise<void> };
export function registerJournalTools(memories: Memory[], select: (id: string) => void) {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const tools: ModelTool[] = [
    { name: 'list_memories', title: 'Erinnerungen auflisten', description: 'Liest die bereits sichtbaren Erinnerungen. Erstellt oder ändert keine Daten.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: input => { if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Es werden keine Parameter erwartet.'); return memories.map(({ id, title, place, date, isExample }) => ({ id, title, place, date, isExample })); } },
    { name: 'show_memory_on_map', title: 'Erinnerung auf der Karte zeigen', description: 'Wählt eine bestehende Erinnerung in der sichtbaren Karte aus. Ändert keine gespeicherten Daten.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute: async input => { if (!input || typeof input !== 'object' || !('id' in input) || typeof input.id !== 'string' || Object.keys(input).length !== 1) throw new Error('Eine Erinnerungs-ID ist erforderlich.'); const m = memories.find(m => m.id === input.id); if (!m) throw new Error('Erinnerung nicht gefunden.'); select(m.id); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); return { selectedId: m.id, title: m.title }; } },
  ];
  tools.forEach(tool => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser capability. */ } });
  return () => lifecycle.abort();
}
