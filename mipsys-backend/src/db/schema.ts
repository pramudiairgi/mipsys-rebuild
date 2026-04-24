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
  boolean,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// 1. Staff
export const staff = mysqlTable('staff', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: mysqlEnum('role', ['ADMIN', 'TECHNICIAN']).notNull(),
});

// 2. Customers
export const customers = mysqlTable('customers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  customerType: varchar('customer_type', { length: 50 }), // Retail, Dealer, dll
});

// 3. Customer Phones
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

// 4. Products
export const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  modelName: varchar('model_name', { length: 100 }).notNull(), // Dari PRODUCT TYPE / TYPE
  serialNumber: varchar('serial_number', { length: 100 }).unique().notNull(),
});

// 5. Service Requests (Main Transaction)
export const serviceRequests = mysqlTable(
  'service_requests',
  {
    id: int('id').autoincrement().primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 100 }).notNull(), // Gabungan/Custom
    rmaNo: varchar('rma_no', { length: 100 }), // Khusus WRNTY
    incNo: varchar('inc_no', { length: 100 }), // Khusus NWRNTY
    serviceType: mysqlEnum('service_type', [
      'WARRANTY',
      'NON_WARRANTY',
    ]).notNull(),

    customerId: int('customer_id').references(() => customers.id),
    productId: int('product_id').references(() => products.id),
    adminId: int('admin_id').references(() => staff.id),
    technicianCheckId: int('tech_check_id').references(() => staff.id),
    technicianFixId: int('tech_fix_id').references(() => staff.id),

    // Timeline & Tracking
    incomingDate: date('incoming_date').notNull(),
    checkDate: date('check_date'),
    spDate: date('sp_date'), // Sparepart Date
    approveDate: date('approve_date'),
    readyDate: date('ready_date'),
    closeDate: date('close_date'),
    pickUpDate: date('pick_up_date'),
    agingDays: int('aging_days').default(0),
    isTelephoned: boolean('is_telephoned').default(false), // Dari TLP CALL

    // Detail & Status
    problemDescription: text('problem_description'),
    statusService: varchar('status_service', { length: 50 }), // WITH PART, CANCEL, dll
    statusSystem: varchar('status_system', { length: 50 }), // OPEN, CLOSED
    remarksHistory: text('remarks_history'), // Penyatuan REMARKS II-VI

    // Financial
    serviceFee: decimal('service_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    partFee: decimal('part_fee', { precision: 12, scale: 2 }).default('0.00'),
    shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ), // Harga Online + Ongkir

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    ticketIdx: index('ticket_idx').on(table.ticketNumber),
    rmaIdx: index('rma_idx').on(table.rmaNo),
  })
);

// 6. Hardware Checks (Detail komponen PH, MB, PS)
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
  legacyOthersNotes: text('legacy_others_notes'), // Dari OTHERS (1-5)
});

// 7. Service Logs (Audit Trail)
export const serviceLogs = mysqlTable('service_logs', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),
  changedBy: int('changed_by_id').references(() => staff.id),
  previousStatus: varchar('previous_status', { length: 100 }),
  currentStatus: varchar('current_status', { length: 100 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Spare Parts (Master Data)
export const spareParts = mysqlTable('spare_parts', {
  id: int('id').autoincrement().primaryKey(),
  partName: varchar('part_name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).unique(),
  stock: int('stock').default(0),
  price: decimal('price', { precision: 12, scale: 2 }).default('0.00'),
});

// 9. Order Parts (Relasi Part yang digunakan di Servis)
export const orderParts = mysqlTable('order_parts', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),
  sparePartId: int('spare_part_id').references(() => spareParts.id),
  quantity: int('quantity').default(1),
  priceAtAction: decimal('price_at_action', { precision: 12, scale: 2 }), // Harga saat transaksi
});

// 10. Attachments (Foto Unit/Nota)
export const attachments = mysqlTable('attachments', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});
