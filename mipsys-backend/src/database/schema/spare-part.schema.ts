import {
  pgTable,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { serviceRequests } from './service-request.schema';
import { orderPartStatusEnum } from './enums';
import { categoryModels } from './category-model.schema';

export const spareParts = pgTable(
  'spare_parts',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    partCode: varchar('part_code', { length: 100 }).unique(),
    modelName: varchar('model_name', { length: 255 }),
    block: varchar('block', { length: 100 }),
    refNo: varchar('ref_no', { length: 50 }),
    partName: varchar('part_name', { length: 255 }).notNull(),
    standard: varchar('standard', { length: 255 }),
    type: varchar('type', { length: 100 }),
    stock: integer('stock').default(0).notNull(),
    minStock: integer('min_stock').default(5).notNull(),
    location: varchar('location', { length: 100 }),
    price: numeric('price', { precision: 12, scale: 2 }).default('0.00'),
    note: text('note'),
    ipStatus: varchar('ip_status', { length: 50 }),
    categoryModelId: integer('category_model_id').references(
      () => categoryModels.id
    ),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    stockNonNeg: check('chk_stock_nonneg', sql`${table.stock} >= 0`),
    minStockNonNeg: check('chk_minstock_nonneg', sql`${table.minStock} >= 0`),
    priceNonNeg: check('chk_price_nonneg', sql`${table.price} >= 0`),
  })
);

export const orderParts = pgTable(
  'order_parts',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    serviceRequestId: integer('service_request_id').references(
      () => serviceRequests.id
    ),
    sparePartId: integer('spare_part_id').references(() => spareParts.id),
    partName: varchar('part_name', { length: 255 }).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    priceAtAction: numeric('price_at_action', {
      precision: 12,
      scale: 2,
    }).default('0.00'),
    status: orderPartStatusEnum('status').default('IN_STOCK'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  },
  (table) => ({
    serviceRequestIdx: index('op_sr_idx').on(table.serviceRequestId),
    sparePartIdx: index('op_sp_idx').on(table.sparePartId),
    qtyPositive: check('chk_op_qty_positive', sql`${table.quantity} > 0`),
    priceNonNeg: check('chk_op_price_nonneg', sql`${table.priceAtAction} >= 0`),
  })
);
