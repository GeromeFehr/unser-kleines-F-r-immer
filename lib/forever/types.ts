export const CATEGORIES = ['Lieblingsmoment', 'Date', 'Abenteuer', 'Meilenstein'] as const;
export type Category = (typeof CATEGORIES)[number];
export type Memory = {
  id: string; title: string; place: string; date: string; story: string;
  category: Category; latitude: number; longitude: number;
  photoUrl: string; photoAlt: string; isExample: boolean;
  createdAt: string; updatedAt: string; revision: number;
};
export type MemoryDraft = Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'revision'>;
export type CoupleSettings = { firstName: string; secondName: string; startLocal: string; timeZone: string };
export type Journal = { memories: Memory[]; settings: CoupleSettings; isAdmin: boolean };
