import {
  mysqlTable,
  serial,
  varchar,
  text,
  date,
  decimal,
  mysqlEnum,
  int,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

// 1. Staff (Menampung kolom ADMIN, TECH CHK, TECH FIX)
export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(), // <--- UBAH DI SINI
  name: varchar("name", { length: 100 }).notNull(),
  role: mysqlEnum("role", ["ADMIN", "TECHNICIAN"]).notNull(),
});

// 2. Customers
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(), // <--- UBAH DI SINI
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  customerType: varchar("customer_type", { length: 50 }),
});

// 3. Customer Phones
export const customerPhones = mysqlTable(
  "customer_phones",
  {
    id: int("id").autoincrement().primaryKey(), // <--- UBAH DI SINI
    customerId: int("customer_id").references(() => customers.id),
    phone: varchar("phone", { length: 50 }).notNull(),
  },
  (table) => ({
    phoneIdx: index("phone_idx").on(table.phone),
  }),
);

// 4. Products
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(), // <--- UBAH DI SINI
  modelName: varchar("model_name", { length: 100 }).notNull(),
  serialNumber: varchar("serial_number", { length: 100 }).unique().notNull(),
});

// 5. Service Requests
export const serviceRequests = mysqlTable(
  "service_requests",
  {
    id: int("id").autoincrement().primaryKey(), // <--- UBAH DI SINI
    ticketNumber: varchar("ticket_number", { length: 100 }).notNull(),
    serviceType: mysqlEnum("service_type", [
      "WARRANTY",
      "NON_WARRANTY",
    ]).notNull(),

    customerId: int("customer_id").references(() => customers.id),
    productId: int("product_id").references(() => products.id),
    adminId: int("admin_id").references(() => staff.id),
    technicianCheckId: int("tech_check_id").references(() => staff.id),
    technicianFixId: int("tech_fix_id").references(() => staff.id),

    incomingDate: date("incoming_date").notNull(),
    readyDate: date("ready_date"), // Tambahan dari Excel
    pickUpDate: date("pick_up_date"), // Tambahan dari Excel

    problemDescription: text("problem_description"),
    statusService: varchar("status_service", { length: 50 }), // WITH PART, CANCEL, dll
    statusSystem: varchar("status_system", { length: 50 }), // OPEN, CLOSED

    // Biaya dari Excel Non-Warranty
    serviceFee: decimal("service_fee", { precision: 12, scale: 2 }).default(
      "0.00",
    ),
    partFee: decimal("part_fee", { precision: 12, scale: 2 }).default("0.00"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    ticketIdx: index("ticket_idx").on(table.ticketNumber), // Agar pencarian 100% ngebut
  }),
);
