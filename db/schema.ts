import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(), title: text('title').notNull(), place: text('place').notNull(),
  date: text('date').notNull(), story: text('story').notNull(), category: text('category').notNull(),
  latitude: real('latitude').notNull(), longitude: real('longitude').notNull(),
  photoUrl: text('photo_url').notNull().default(''), photoAlt: text('photo_alt').notNull().default(''),
  isExample: integer('is_example', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
  revision: integer('revision').notNull().default(1),
}, table => [index('idx_memories_date').on(table.date)]);
export const appState = sqliteTable('app_state', { key: text('key').primaryKey(), value: text('value').notNull() });
export const admins = sqliteTable('admins', { role: text('role').primaryKey(), userId: text('user_id').notNull().unique() });
export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(), contentType: text('content_type').notNull(),
  uploadedBy: text('uploaded_by').notNull(), createdAt: text('created_at').notNull(),
});
