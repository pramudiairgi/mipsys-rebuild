import {
  pgTable,
  integer,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staff } from './service-request.schema';
import { userRoleEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    staffId: integer('staff_id').references(() => staff.id),
    username: varchar('username', { length: 50 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull(),
    refreshToken: varchar('refresh_token', { length: 255 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index('username_idx').on(table.username),
    // 1 staff = maksimal 1 akun login (kolom staff_id opsional)
    staffUnique: uniqueIndex('users_staff_unique')
      .on(table.staffId)
      .where(sql`${table.staffId} IS NOT NULL`),
  })
);
