import {
  mysqlTable,
  varchar,
  text,
  date,
  decimal,
  mysqlEnum,
  int,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core';
import { relations, eq } from 'drizzle-orm';

export const staff = mysqlTable('staff', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: mysqlEnum('role', ['ADMIN', 'TECHNICIAN']).notNull(),
});

export const customers = mysqlTable('customers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  customerType: varchar('customer_type', { length: 50 }),
});

export const customerPhones = mysqlTable(
  'customer_phones',
  {
    id: int('id').autoincrement().primaryKey(),
    customerId: int('customer_id').references(() => customers.id),
    phone: varchar('phone', { length: 50 }).notNull(),
  },
  (table) => ({
    phoneIdx: index('phone_idx').on(table.phone),
  })
);

export const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }).unique().notNull(),
});

export const serviceRequests = mysqlTable(
  'service_requests',
  {
    id: int('id').autoincrement().primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 100 }).notNull(),
    rmaNo: varchar('rma_no', { length: 100 }),
    incNo: varchar('inc_no', { length: 100 }),
    serviceType: mysqlEnum('service_type', [
      'WARRANTY',
      'NON_WARRANTY',
    ]).notNull(),

    customerId: int('customer_id').references(() => customers.id),
    productId: int('product_id').references(() => products.id),
    adminId: int('admin_id').references(() => staff.id),
    technicianCheckId: int('tech_check_id').references(() => staff.id),

    incomingDate: date('incoming_date').notNull(),
    checkDate: date('check_date'),
    spDate: date('sp_date'),
    approveDate: date('approve_date'),
    readyDate: date('ready_date'),
    closeDate: date('close_date'),
    pickUpDate: date('pick_up_date'),
    agingDays: int('aging_days').default(0),

    problemDescription: text('problem_description'),
    statusService: varchar('status_service', { length: 50 }),
    statusSystem: varchar('status_system', { length: 50 }),
    remarksHistory: text('remarks_history'),

    serviceFee: decimal('service_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    partFee: decimal('part_fee', { precision: 12, scale: 2 }).default('0.00'),
    shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    ticketIdx: index('ticket_idx').on(table.ticketNumber),
    rmaIdx: index('rma_idx').on(table.rmaNo),
  })
);

export const hardwareChecks = mysqlTable('hardware_checks', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),
  phStatus: varchar('ph_status', { length: 100 }),
  mbStatus: varchar('mb_status', { length: 100 }),
  psStatus: varchar('ps_status', { length: 100 }),
  othersStatus: varchar('others_status', { length: 100 }),
  accessories: text('accessories'),
  legacyOthersNotes: text('legacy_others_notes'),
});

export const spareParts = mysqlTable('spare_parts', {
  id: int('id').primaryKey().autoincrement(),
  partCode: varchar('part_code', { length: 100 }).unique(),
  modelName: varchar('model_name', { length: 255 }),
  block: varchar('block', { length: 100 }),
  refNo: varchar('ref_no', { length: 50 }),
  partName: varchar('part_name', { length: 255 }).notNull(),
  standard: varchar('standard', { length: 255 }),
  type: varchar('type', { length: 100 }),
  stock: int('stock').default(0).notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).default('0.00'),
  note: text('note'),
  ipStatus: varchar('ip_status', { length: 50 }),
});

export const orderParts = mysqlTable('order_parts', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),

  // sparePartId dibuat nullable agar bisa menampung input manual (part belum ada di master)
  sparePartId: int('spare_part_id').references(() => spareParts.id),

  // Backup nama jika input manual atau stok kosong
  partName: varchar('part_name', { length: 255 }).notNull(),
  quantity: int('quantity').default(1).notNull(),

  // Harga saat transaksi dilakukan (mengunci harga agar tidak berubah jika master part berubah)
  priceAtAction: decimal('price_at_action', {
    precision: 12,
    scale: 2,
  }).default('0.00'),

  // Tracking Status
  status: mysqlEnum('status', [
    'IN_STOCK',
    'OUT_OF_STOCK',
    'MANUAL_NEW',
  ]).default('IN_STOCK'),

  // Procurement Status
  orderStatus: mysqlEnum('order_status', [
    'NONE',
    'PENDING',
    'ORDERED',
    'RECEIVED',
    'CANCELLED',
  ]).default('NONE'),

  createdAt: timestamp('created_at').defaultNow(),
});

export const serviceRequestsRelations = relations(
  serviceRequests,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [serviceRequests.customerId],
      references: [customers.id],
    }),
    product: one(products, {
      fields: [serviceRequests.productId],
      references: [products.id],
    }),
    orderParts: many(orderParts),
    hardwareCheck: one(hardwareChecks, {
      fields: [serviceRequests.id],
      references: [hardwareChecks.serviceRequestId],
    }),
    technicianCheck: one(staff, {
      fields: [serviceRequests.technicianCheckId],
      references: [staff.id],
    }),
  })
);

export const orderPartsRelations = relations(orderParts, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [orderParts.serviceRequestId],
    references: [serviceRequests.id],
  }),
  sparePart: one(spareParts, {
    fields: [orderParts.sparePartId],
    references: [spareParts.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  phones: many(customerPhones),
  requests: many(serviceRequests),
}));

export const customerPhonesRelations = relations(customerPhones, ({ one }) => ({
  customer: one(customers, {
    fields: [customerPhones.customerId],
    references: [customers.id],
  }),
}));
