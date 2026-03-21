import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;

const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
export { schema };
