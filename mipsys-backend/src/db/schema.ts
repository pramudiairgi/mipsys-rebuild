import { mysqlTable, int, varchar, text, timestamp, date, index, uniqueIndex } from 'drizzle-orm/mysql-core';

// --- 1. LOKASI (Parent dari semua) ---
export const locations = mysqlTable('locations', {
  id: int('id').autoincrement().primaryKey(), 
  name: varchar('name', { length: 255 }).notNull(),
  warehouse_id: int('warehouse_id'),
  cost_center: varchar('cost_center', { length: 50 }),
});

// --- 2. SERVICE REQUESTS (Parent dari Part Requests) ---
// PINDAHKAN KE SINI AGAR TERBACA DULUAN
export const serviceRequests = mysqlTable('service_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sr_number: varchar('sr_number', { length: 50 }).notNull(),
  customer_name: varchar('customer_name', { length: 255 }),
  problem_desc: text('problem_desc'),
  status: varchar('status', { length: 20 }).default('OPEN'),
  location_id: int('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  srIdx: uniqueIndex('sr_number_idx').on(table.sr_number), 
}));

// --- 3. SHIPMENTS ---
export const shipments = mysqlTable('shipments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  location_id: int('location_id').references(() => locations.id),
  status: varchar('status', { length: 50 }),
  issue_date: date('issue_date'),
  picklist_no: varchar('picklist_no', { length: 100 }).unique(),
});

// --- 4. PART REQUESTS (Child dari Service Requests) ---
// SEKARANG INI AMAN KARENA serviceRequests SUDAH ADA DI ATAS
export const partRequests = mysqlTable('part_requests', {
  id: int('id').autoincrement().primaryKey(),
  sr_id: varchar('sr_id', { length: 36 }).references(() => serviceRequests.id, { onDelete: 'cascade' }),
  part_no: varchar('part_no', { length: 100 }),
  quantity: int('quantity').default(1),
  request_status: varchar('request_status', { length: 20 }).default('WAITING'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  partIdx: index('part_no_idx').on(table.part_no),
}));

// --- 5. PART MAPPINGS ---
export const partMappings = mysqlTable('part_mappings', {
  id: int('id').autoincrement().primaryKey(),
  keyword: varchar('keyword', { length: 100 }).notNull(),
  machine_type: varchar('machine_type', { length: 100 }),
  part_no: varchar('part_no', { length: 100 }).notNull(),
  part_name: varchar('part_name', { length: 255 }),
});