import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';

const connection = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_mipsys',
  connectionLimit: 10,
});
export const db = drizzle(connection, { schema, mode: 'default' });

export type Database = typeof db;
