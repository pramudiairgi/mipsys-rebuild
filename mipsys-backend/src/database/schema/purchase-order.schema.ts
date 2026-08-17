import {
  pgTable,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  date,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staff } from './service-request.schema';
import { poStatusEnum } from './enums';

export const purchaseOrders = pgTable(
  'purchase_orders',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    poNumber: varchar('po_number', { length: 100 }).unique().notNull(),
    supplierName: varchar('supplier_name', { length: 50 })
      .default('EPSON')
      .notNull(),
    status: poStatusEnum('status').default('DRAFT'),
    requestedBy: integer('requested_by').references(() => staff.id),
    approvedBy: integer('approved_by').references(() => staff.id),
    orderDate: date('order_date'),
    expectedDate: date('expected_date'),
    receivedDate: date('received_date'),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).default(
      '0.00'
    ),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    poNumberIdx: index('po_number_idx').on(table.poNumber),
    statusIdx: index('po_status_idx').on(table.status),
    requestedByIdx: index('po_requested_by_idx').on(table.requestedBy),
    approvedByIdx: index('po_approved_by_idx').on(table.approvedBy),
    orderDateIdx: index('po_order_date_idx').on(table.orderDate),
    totalNonNeg: check('chk_po_total_nonneg', sql`${table.totalAmount} >= 0`),
  })
);
