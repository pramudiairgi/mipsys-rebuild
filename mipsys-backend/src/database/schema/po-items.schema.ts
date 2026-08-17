import {
  pgTable,
  varchar,
  numeric,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { purchaseOrders } from './purchase-order.schema';
import { spareParts } from './spare-part.schema';

export const poItems = pgTable(
  'po_items',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    purchaseOrderId: integer('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id),
    sparePartId: integer('spare_part_id').references(() => spareParts.id),
    partName: varchar('part_name', { length: 200 }),
    modelName: varchar('model_name', { length: 255 }),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    receivedQty: integer('received_qty').default(0),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  },
  (table) => ({
    poIdx: index('po_items_po_idx').on(table.purchaseOrderId),
    spIdx: index('po_items_sp_idx').on(table.sparePartId),
    qtyPositive: check('chk_poi_qty_positive', sql`${table.quantity} > 0`),
    priceNonNeg: check('chk_poi_price_nonneg', sql`${table.unitPrice} >= 0`),
    receivedRange: check(
      'chk_poi_recv_range',
      sql`${table.receivedQty} IS NULL OR (${table.receivedQty} >= 0 AND ${table.receivedQty} <= ${table.quantity})`
    ),
  })
);
