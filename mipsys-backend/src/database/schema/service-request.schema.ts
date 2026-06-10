import {
  pgTable,
  varchar,
  text,
  date,
  numeric,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staffRoleEnum, serviceTypeEnum, serviceStatusEnum } from './enums';

export const staff = pgTable('staff', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: staffRoleEnum('role').notNull(),
});

export const customers = pgTable('customers', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  customerType: varchar('customer_type', { length: 50 }),
});

export const products = pgTable('products', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }).unique().notNull(),
});

export const serviceRequests = pgTable(
  'service_requests',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 100 }).unique().notNull(),
    rmaNo: varchar('rma_no', { length: 100 }),
    incNo: varchar('inc_no', { length: 100 }),
    serviceType: serviceTypeEnum('service_type').notNull(),
    customerId: integer('customer_id').references(() => customers.id),
    productId: integer('product_id').references(() => products.id),
    adminId: integer('admin_id').references(() => staff.id),
    technicianCheckId: integer('tech_check_id').references(() => staff.id),
    incomingDate: date('incoming_date').notNull(),
    checkDate: date('check_date'),
    spDate: date('sp_date'),
    approveDate: date('approve_date'),
    readyDate: date('ready_date'),
    closeDate: date('close_date'),
    pickUpDate: date('pick_up_date'),
    agingDays: integer('aging_days').default(0),
    problemDescription: text('problem_description'),
    statusService: serviceStatusEnum('status_service').default('WAITING_CHECK'),
    statusSystem: varchar('status_system', { length: 50 }),
    remarksHistory: text('remarks_history'),
    serviceFee: numeric('service_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    partFee: numeric('part_fee', { precision: 12, scale: 2 }).default('0.00'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    ticketIdx: index('ticket_idx').on(table.ticketNumber),
    rmaIdx: index('rma_idx').on(table.rmaNo),
  })
);

export const serviceLogs = pgTable('service_logs', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  serviceRequestId: integer('service_request_id').references(
    () => serviceRequests.id
  ),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description'),
  performedBy: integer('performed_by'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
