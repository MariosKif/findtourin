import { Resend } from 'resend';

// Mirror of src/lib/supabase.ts: defer client creation until first property
// access. On the Vercel/@astrojs/vercel runtime, env vars are not always
// populated by the time shared chunks are first imported — and we already
// got bitten by that with the Supabase client. Same fix here.
let _client: Resend | null = null;

function getClient(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY || '';
  if (!key) {
    console.error('FATAL: RESEND_API_KEY is not set on the running function.');
  }
  _client = new Resend(key);
  return _client;
}

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
