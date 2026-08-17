import {
  pgTable,
  varchar,
  numeric,
  integer,
  timestamp,
  date,
  text,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { serviceRequests } from './service-request.schema';
import { invoiceStatusEnum, paymentMethodEnum } from './enums';

export const invoices = pgTable(
  'invoices',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 100 })
      .unique()
      .notNull(),
    ticketNumber: varchar('ticket_number', { length: 100 }).notNull(),
    serviceRequestId: integer('service_request_id').references(
      () => serviceRequests.id
    ),
    clientName: varchar('client_name', { length: 255 }).notNull(),
    serviceFee: numeric('service_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    partFee: numeric('part_fee', { precision: 12, scale: 2 }).default('0.00'),
    ppn: numeric('ppn', { precision: 12, scale: 2 }).default('0.00'),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    status: invoiceStatusEnum('status').default('UNPAID'),
    paymentMethod: paymentMethodEnum('payment_method'),
    invoiceDate: date('invoice_date').notNull(),
    paidDate: date('paid_date'),
    notes: text('notes'),
    ppnRate: numeric('ppn_rate', { precision: 5, scale: 2 }).default('11.00'),
    voidedAt: timestamp('voided_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    ticketIdx: index('inv_ticket_idx').on(table.ticketNumber),
    statusIdx: index('inv_status_idx').on(table.status),
    ticketUnique: uniqueIndex('inv_ticket_unique').on(table.ticketNumber),
    // 1 invoice AKTIF (belum void) per service request; boleh re-invoice setelah VOID
    activeSrUnique: uniqueIndex('inv_sr_unique')
      .on(table.serviceRequestId)
      .where(sql`${table.voidedAt} IS NULL`),
    amountsNonNeg: check(
      'chk_inv_amounts_nonneg',
      sql`${table.serviceFee} >= 0 AND ${table.partFee} >= 0 AND ${table.ppn} >= 0 AND ${table.total} >= 0`
    ),
  })
);
