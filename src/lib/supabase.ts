import { createClient } from '@supabase/supabase-js';

// IMPORTANT: read from process.env ONLY at runtime — do not use import.meta.env
// here. import.meta.env values are inlined at build time by Vite/Astro, so if
// the env var is configured for runtime-only on Vercel (not build), the build
// inlines an empty/stale value into this module and the supabase client
// behaves as anon at runtime (RLS errors on every write). Reading process.env
// resolves the value at request time, which is always correct.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fail loudly if the service-role key is missing. Falling back silently to an
// empty string makes the client behave as anon, which means RLS-protected
// writes return 'new row violates row-level security policy' and reads
// return empty — both confusing in production.
if (!supabaseServiceKey) {
  console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY is not set on the running function. Set it in your Vercel project Production env vars (and ensure the variable is exposed to the runtime, not just build).');
}
if (!supabaseUrl) {
  console.error('FATAL: SUPABASE_URL is not set on the running function.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
