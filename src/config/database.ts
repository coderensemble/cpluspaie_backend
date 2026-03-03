import pkg from 'pg';
const { Pool } = pkg;
import { env } from './environment.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
});

export default pool;