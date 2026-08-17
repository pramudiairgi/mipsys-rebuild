import { Pool } from 'pg';
import 'dotenv/config';

async function dropAll() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_mipsys',
    port: Number(process.env.DB_PORT) || 5433,
  });

  const tables = [
    'stock_movements',
    'payment_histories',
    'order_parts',
    'po_items',
    'service_logs',
    'expenses',
    'invoices',
    'purchase_orders',
    'service_requests',
    'spare_parts',
    'products',
    'customers',
    'staff',
    'users',
    'finance_settings',
    'category_models',
  ];

  for (const table of tables) {
    await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
  }

  const enumTypes = [
    'service_status',
    'po_status',
    'user_role',
    'service_type',
    'staff_role',
    'movement_type',
    'invoice_status',
    'payment_method',
    'expense_type',
    'expense_category',
    'order_part_status',
  ];

  for (const enumType of enumTypes) {
    await pool.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE`);
  }

  await pool.end();
  console.log('All tables and enums dropped.');
}

dropAll().catch(console.error);
