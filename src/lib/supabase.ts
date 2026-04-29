import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fail loudly if the service-role key is missing on the server. Falling back
// silently to an empty string makes the client behave as anon, which means
// RLS-protected writes return 'new row violates row-level security policy'
// and reads return empty — both of which are confusing in production.
if (!supabaseServiceKey) {
  console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY is not set. Server-side Supabase calls will fail with RLS errors. Set it in your Vercel project Production env vars.');
}
if (!supabaseUrl) {
  console.error('FATAL: SUPABASE_URL is not set.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
