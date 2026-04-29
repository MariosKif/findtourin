import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: lazy-initialise. We previously read process.env at module load,
// but on the Vercel/@astrojs/vercel runtime the env vars are not always
// populated by the time shared chunks are first imported. The result was a
// supabase client created with an empty key, behaving as anon, hitting RLS
// on every write ('new row violates row-level security policy').
//
// The Proxy below defers client creation until the first property access
// (i.e., the first `.from()`, `.auth`, `.rpc()` call), at which point env
// vars are guaranteed to be populated. The client is then memoised so we
// only construct it once per cold function instance.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY is not set on the running function. Set it in your Vercel Production env vars and ensure it is exposed to the runtime.');
  }
  if (!url) {
    console.error('FATAL: SUPABASE_URL is not set on the running function.');
  }
  _client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _client;
}

// Proxy that forwards every operation to the lazily-constructed client.
// Importers can keep using `supabase.from(...)`, `supabase.auth.admin...`,
// `supabase.rpc(...)` etc. exactly as before — no call-site changes needed.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
