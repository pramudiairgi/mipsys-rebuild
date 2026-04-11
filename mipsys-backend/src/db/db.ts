import 'dotenv/config'; // Sangat penting agar process.env tidak undefined
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

const connection = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'mipsys',
});

export const db = drizzle(connection);