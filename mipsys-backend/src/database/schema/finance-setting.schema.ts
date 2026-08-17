import {
  pgTable,
  varchar,
  integer,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const financeSettings = pgTable('finance_settings', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: text('value').notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});
