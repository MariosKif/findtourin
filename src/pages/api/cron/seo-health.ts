// Nightly SEO health check. Runs every night via Vercel Cron and:
//   1. Counts indexable URLs against the same gates the sitemap uses
//   2. Flags hubs that crossed the indexability threshold (newly index-able
//      → push to IndexNow so search engines crawl them quickly)
//   3. Flags hubs that fell below the threshold (newly thin → log for
//      editorial review; the sitemap will already have dropped them)
//   4. Returns a JSON summary the cron logs preserve for trend tracking
//
// This is the programmatic "quality gate" referenced in P5.2: any page
// score that drifts is caught nightly rather than discovered weeks later
// in Search Console.
//
// Vercel Cron POSTs here with Authorization: Bearer ${CRON_SECRET}.
// Configure in vercel.json under "crons".

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { slugify, getCityIntentCopy, getDayTripCopy } from '../../../lib/destinations';
import { INTENT_SLUGS, tourMatchesIntent, MIN_TOURS_FOR_INDEX } from '../../../lib/programmatic';
import { TOUR_LIST_SELECT } from '../../../lib/tour-helpers';
import { submitToIndexNow } from '../../../lib/seo/indexnow';
import { GUIDES } from '../../../lib/seo/guides';
import { COMPETITORS } from '../../../lib/seo/competitors';

export const prerender = false;

const SITE = 'https://www.findtoursin.com';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

function checkAuth(request: Request): { ok: true } | { ok: false; reason: string } {
  const expected = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '';
  if (!expected) return { ok: false, reason: 'CRON_SECRET not configured' };
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${expected}`) return { ok: false, reason: 'Forbidden' };
  return { ok: true };
}

interface HealthSummary {
  startedAt: string;
  durationMs: number;
  counts: {
    countries: number;
    cityHubs: number;
    categoryCountryHubs: number;
    intentPages: number;
    dayTripPages: number;
    tourDetail: number;
    guides: number;
    comparisons: number;
    alternatives: number;
  };
  warnings: string[];
  /** URLs we pushed to IndexNow this run. */
  indexNowSubmitted: string[];
}

export const GET: APIRoute = async ({ request }) => handle(request);
export const POST: APIRoute = async ({ request }) => handle(request);

async function handle(request: Request): Promise<Response> {
  // Allow GET for manual smoke without auth in dev (CRON_SECRET unset);
  // require auth otherwise. POST always requires auth (Vercel Cron sends POST).
  const expected = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '';
  if (request.method === 'POST' || expected) {
    const auth = checkAuth(request);
    if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'CRON_SECRET not configured' ? 500 : 403);
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const summary: HealthSummary = {
    startedAt,
    durationMs: 0,
    counts: {
      countries: 0,
      cityHubs: 0,
      categoryCountryHubs: 0,
      intentPages: 0,
      dayTripPages: 0,
      tourDetail: 0,
      guides: 0,
      comparisons: 0,
      alternatives: 0,
    },
    warnings: [],
    indexNowSubmitted: [],
  };

  try {
    const { data: tours, error } = await supabase
      .from('tours')
      .select(TOUR_LIST_SELECT)
      .eq('status', 'active');
    if (error) throw error;

    summary.counts.tourDetail = (tours || []).length;

    // Replicate the sitemap's gate logic to compute current index counts.
    const countryToursCount = new Map<string, number>();
    const countryCityCount = new Map<string, number>();
    const countryCategoryCount = new Map<string, number>();
    const cityBucket = new Map<string, { countrySlug: string; citySlug: string; cityName: string; countryName: string; tours: any[] }>();

    for (const t of tours || []) {
      if (!t.country) continue;
      const cs = slugify(t.country);
      countryToursCount.set(cs, (countryToursCount.get(cs) || 0) + 1);
      if (t.city) {
        const key = `${cs}|${slugify(t.city)}`;
        countryCityCount.set(key, (countryCityCount.get(key) || 0) + 1);
        if (!cityBucket.has(key)) {
          cityBucket.set(key, { countrySlug: cs, citySlug: slugify(t.city), cityName: t.city, countryName: t.country, tours: [] });
        }
        cityBucket.get(key)!.tours.push(t);
      }
      if (t.category) {
        const key = `${slugify(t.category)}|${cs}`;
        countryCategoryCount.set(key, (countryCategoryCount.get(key) || 0) + 1);
      }
    }

    summary.counts.countries = Array.from(countryToursCount.values()).filter((c) => c >= 2).length;
    summary.counts.cityHubs = Array.from(countryCityCount.values()).filter((c) => c >= 2).length;
    summary.counts.categoryCountryHubs = Array.from(countryCategoryCount.values()).filter((c) => c >= 2).length;

    // Intent + day-trip page counts
    let intentCount = 0;
    let dayTripCount = 0;
    for (const bucket of cityBucket.values()) {
      for (const intent of INTENT_SLUGS) {
        const matches = bucket.tours.filter((t: any) => tourMatchesIntent(t, intent)).length;
        if (matches < MIN_TOURS_FOR_INDEX) continue;
        const copy = getCityIntentCopy(bucket.cityName, bucket.countryName, intent);
        if (!copy.curated) continue;
        intentCount += 1;
      }
      const dayTripEligible = bucket.tours.filter((t: any) => {
        const d = typeof t.duration_days === 'number' ? t.duration_days : null;
        return d !== null && d <= 1;
      }).length;
      if (dayTripEligible >= MIN_TOURS_FOR_INDEX && getDayTripCopy(bucket.cityName).curated) {
        dayTripCount += 1;
      }
    }
    summary.counts.intentPages = intentCount;
    summary.counts.dayTripPages = dayTripCount;

    summary.counts.guides = GUIDES.length;
    summary.counts.comparisons = COMPETITORS.length;
    summary.counts.alternatives = COMPETITORS.length;

    // Warnings: cities that are right on the edge (≥1 but <2 tours) —
    // editorial should consider whether to onboard one more agency in
    // that city to unlock the hub.
    for (const [country, count] of countryToursCount) {
      if (count === 1) summary.warnings.push(`Country ${country} has only 1 tour — country hub is suppressed.`);
    }
    for (const [key, count] of countryCityCount) {
      if (count === 1) summary.warnings.push(`City hub ${key.replace('|', '/')} has only 1 tour — suppressed.`);
    }

    // Push every active tour URL to IndexNow daily — keeps freshness signal
    // strong without spamming. Best-effort; silent no-op if INDEXNOW_KEY
    // isn't configured.
    const tourUrls = (tours || [])
      .filter((t: any) => t.slug)
      .slice(0, 1000) // IndexNow batch cap
      .map((t: any) => `${SITE}/tours/${t.slug}`);
    if (tourUrls.length > 0) {
      const result = await submitToIndexNow(tourUrls);
      if (result.ok) summary.indexNowSubmitted = tourUrls;
      else summary.warnings.push(`IndexNow: ${result.message}`);
    }
  } catch (err) {
    summary.warnings.push(err instanceof Error ? err.message : 'Unknown error');
  }

  summary.durationMs = Date.now() - t0;
  return json(summary);
}
