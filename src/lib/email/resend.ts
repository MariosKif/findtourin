import { Resend } from 'resend';

// Mirror of src/lib/supabase.ts: defer client creation until first property
// access. On the Vercel/@astrojs/vercel runtime, env vars are not always
// populated by the time shared chunks are first imported — and we already
// got bitten by that with the Supabase client. Same fix here.
//
// `_client` uses `undefined` as "not yet attempted to init" and `null` as
// "tried, key missing — never going to work this lifetime". The latter
// short-circuits subsequent calls so we don't repeatedly throw inside the
// SDK constructor (Resend SDK 6.x throws synchronously on an empty key).
let _client: Resend | null | undefined = undefined;

export function getResendClient(): Resend | null {
  if (_client !== undefined) return _client;
  const key = process.env.RESEND_API_KEY || '';
  if (!key) {
    console.error('FATAL: RESEND_API_KEY is not set on the running function.');
    _client = null;
    return null;
  }
  _client = new Resend(key);
  return _client;
}

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const client = getResendClient();
    if (!client) {
      // Returning a stub avoids "Cannot read properties of null" on every
      // chained access. send.ts also defends, but this is belt-and-braces.
      throw new Error('Resend client unavailable (RESEND_API_KEY missing).');
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
