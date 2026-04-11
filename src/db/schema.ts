import { mysqlTable, int, varchar, serial, date, bigint } from 'drizzle-orm/mysql-core';

export const locations = mysqlTable('locations', {
  // Gunakan int().autoincrement() untuk kompatibilitas penuh dengan MariaDB
  id: int('id').autoincrement().primaryKey(), 
  name: varchar('name', { length: 255 }).notNull(),
  warehouse_id: int('warehouse_id'), // Berisi data seperti 8700 [cite: 20]
  cost_center: varchar('cost_center', { length: 50 }), // Berisi data seperti E5SGTB [cite: 20]
});

export const shipments = mysqlTable('shipments', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID manual atau otomatis
  location_id: int('location_id').references(() => locations.id),
  status: varchar('status', { length: 50 }), // AWB OK [cite: 131, 156]
  issue_date: date('issue_date'), // 20/10/2025 [cite: 131]
  picklist_no: varchar('picklist_no', { length: 100 }).unique(), // T43791 [cite: 133]
});