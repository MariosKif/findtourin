/**
 * Set up the Supabase database schema.
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres" node scripts/setup-db.mjs
 *
 * Find your DATABASE_URL in:
 *   Supabase Dashboard > Project Settings > Database > Connection string > URI
 *
 * Alternatively, copy the contents of scripts/supabase-schema.sql and paste
 * them into the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/fyhdsmeiystsehdsipar/sql).
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  console.error('');
  console.error('Find it in: Supabase Dashboard > Project Settings > Database > Connection string > URI');
  console.error('');
  console.error('Example:');
  console.error('  DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres" node scripts/setup-db.mjs');
  process.exit(1);
}

const sqlContent = readFileSync(join(__dirname, 'supabase-schema.sql'), 'utf-8');
const db = postgres(connectionString, { ssl: 'require' });

try {
  console.log('Connecting to database...');
  await db.unsafe(sqlContent);
  console.log('Schema created successfully!');

  const tables = await db`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  console.log('\nTables:');
  tables.forEach(t => console.log(`  - ${t.table_name}`));

  const policies = await db`
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;

  console.log(`\nRLS policies: ${policies.length}`);
  policies.forEach(p => console.log(`  - ${p.tablename}: ${p.policyname}`));

  console.log('\nDone!');
} catch (err) {
  console.error('Error running schema:', err.message);
  process.exit(1);
} finally {
  await db.end();
}
