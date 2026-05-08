// IndexNow protocol submission. Used by Bing, Yandex, Seznam.cz, and Naver
// to drop indexing latency from days to hours. We POST changed URLs to
// https://api.indexnow.org/indexnow whenever a tour or blog post is added
// or updated.
//
// Setup (one-time, done by the project owner):
//   1. Generate a 32+ char hex key (any UUID is fine).
//   2. Save it as public/<KEY>.txt with the key value as the file content.
//   3. Set INDEXNOW_KEY in Vercel env vars to that same value.
//
// Without INDEXNOW_KEY set, this module is a no-op — calls return early.

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'www.findtoursin.com';

export interface IndexNowResult {
  ok: boolean;
  /** HTTP status from the IndexNow endpoint, or 0 when we never called. */
  status: number;
  /** Submitted URL count (0 when we skipped). */
  submitted: number;
  /** Reason for skipping or failing. */
  message?: string;
}

/** Submit one or many URLs to the IndexNow protocol. Validates each URL
 *  belongs to our host (IndexNow rejects mixed-host submissions) and
 *  silently no-ops if INDEXNOW_KEY isn't configured. */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY || '';
  if (!key) {
    return { ok: false, status: 0, submitted: 0, message: 'INDEXNOW_KEY not configured — skipped.' };
  }

  // Filter to URLs belonging to our host. IndexNow returns 422 if any URL
  // is outside the host that owns the key file.
  const urlList = Array.from(new Set(urls)).filter((u) => {
    try {
      const parsed = new URL(u);
      return parsed.host === HOST;
    } catch {
      return false;
    }
  });

  if (urlList.length === 0) {
    return { ok: false, status: 0, submitted: 0, message: 'No valid URLs for host.' };
  }

  // Single URL: GET with query params. Multiple URLs: POST with JSON body.
  // Both forms are valid per the IndexNow spec; we use POST exclusively
  // for consistency.
  const body = JSON.stringify({
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList,
  });

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body,
    });
    return {
      ok: res.ok,
      status: res.status,
      submitted: urlList.length,
      message: res.ok ? 'Submitted.' : `IndexNow returned ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      submitted: 0,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
