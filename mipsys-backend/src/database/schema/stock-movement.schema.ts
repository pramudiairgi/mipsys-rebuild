import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { spareParts } from './spare-part.schema';
import { staff } from './service-request.schema';
import { movementTypeEnum } from './enums';

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    sparePartId: integer('spare_part_id')
      .notNull()
      .references(() => spareParts.id),
    quantity: integer('quantity').notNull(),
    movementType: movementTypeEnum('movement_type').notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: varchar('reference_id', { length: 100 }),
    performedBy: integer('performed_by').references(() => staff.id),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    sparePartIdx: index('sm_sp_idx').on(table.sparePartId),
    movementTypeIdx: index('sm_type_idx').on(table.movementType),
    referenceIdx: index('sm_reference_idx').on(
      table.referenceType,
      table.referenceId
    ),
  })
);
