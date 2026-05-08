// Single source of truth for programmatic-SEO indexability and year-stamped
// title freshness. Used by every templated route AND the dynamic sitemap, so
// what we surface to users matches what we declare to crawlers.
//
// White-hat doctrine: a templated page either has enough unique content to
// stand on its own (≥ MIN_TOURS, unique copy, real FAQ) or it returns 404 —
// we never ship a thin 200. This is the rule that prevents Scaled Content
// Abuse classification (March 2024 policy).

export const MIN_TOURS_FOR_INDEX = 3;

export interface IndexabilityCheck {
  /** Number of unique tours surfaced on the page. */
  tourCount: number;
  /** Whether the page renders unique editorial copy (intro + FAQ),
   *  not just a swapped city/intent token. */
  hasUniqueCopy: boolean;
  /** Override floor when a hub deliberately uses a higher bar
   *  (category × country, intent pages — typically MIN_TOURS_FOR_INDEX). */
  minTours?: number;
}

/** Returns true when a page is allowed in the index AND in the sitemap.
 *  Returning false should cause the route to either 404 or render
 *  `noIndex={true}` — the caller decides which is appropriate. */
export function shouldIndex({ tourCount, hasUniqueCopy, minTours = MIN_TOURS_FOR_INDEX }: IndexabilityCheck): boolean {
  if (tourCount < minTours) return false;
  if (!hasUniqueCopy) return false;
  return true;
}

/** Returns the current year for deterministic title refresh.
 *  Centralised so the value never falls out of sync between title,
 *  H1, and the "What's new in [year]" copy block. */
export function currentYear(): number {
  return new Date().getFullYear();
}

export type YearStampTemplate =
  | 'country-hub'
  | 'city-hub'
  | 'category-country'
  | 'intent-city'
  | 'day-trips-from';

/** Year-stamped title generator. Keep all formats in one place so
 *  changing the title style (e.g. brand suffix) is one edit, not 10. */
export function getYearStampedTitle(
  template: YearStampTemplate,
  vars: { country?: string; city?: string; category?: string; intent?: string; tourCount?: number; priceFrom?: number },
): string {
  const y = currentYear();
  const c = vars.country || '';
  const ci = vars.city || '';
  const cat = vars.category || '';
  const cnt = vars.tourCount;
  const pf = vars.priceFrom;
  switch (template) {
    case 'country-hub':
      return cnt && pf
        ? `Tours in ${c} ${y} — ${cnt} Trips from €${pf}`
        : `Tours in ${c} ${y}`;
    case 'city-hub':
      return pf
        ? `Things to Do in ${ci}, ${c} ${y} — Tours from €${pf}`
        : `Things to Do in ${ci}, ${c} ${y}`;
    case 'category-country':
      return cnt && pf
        ? `${cat} in ${c} ${y} — ${cnt} Tours from €${pf}`
        : `${cat} in ${c} ${y}`;
    case 'intent-city':
      return `${humanIntent(vars.intent || '')} in ${ci}, ${c} ${y}`;
    case 'day-trips-from':
      return `Day Trips from ${ci} ${y} — Best Excursions & Tours`;
    default:
      return `${c} ${y}`;
  }
}

/** Whitelist of intent slugs we are willing to ship as `/tours/in/[country]/[city]/[intent]`.
 *  Anything outside this list 404s before any DB call. Prevents arbitrary
 *  /tours/in/greece/athens/foo from being a soft-200. */
export const INTENT_SLUGS = [
  'food-tours',
  'walking-tours',
  'multi-day',
  'half-day',
  'budget',
  'luxury',
  'private',
  'with-kids',
  'free-tours',
] as const;

export type IntentSlug = (typeof INTENT_SLUGS)[number];

export function isIntentSlug(s: string): s is IntentSlug {
  return (INTENT_SLUGS as readonly string[]).includes(s);
}

/** Human-readable label for an intent slug, used in titles/H1s/breadcrumbs. */
export function humanIntent(intent: string): string {
  switch (intent) {
    case 'food-tours': return 'Food Tours';
    case 'walking-tours': return 'Walking Tours';
    case 'multi-day': return 'Multi-Day Tours';
    case 'half-day': return 'Half-Day Tours';
    case 'budget': return 'Budget Tours';
    case 'luxury': return 'Luxury Tours';
    case 'private': return 'Private Tours';
    case 'with-kids': return 'Family Tours';
    case 'free-tours': return 'Free Walking Tours';
    default: return intent.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

interface TourFilterShape {
  category?: string | null;
  duration_days?: number | null;
  price?: number | string | null;
  description?: string | null;
  name?: string | null;
}

/** Predicate for whether a tour matches a given intent. Pure function — no DB
 *  calls — so it can be reused by listing pages, the sitemap, and anywhere
 *  else we need to count matches. Conservative on purpose: tours we can't
 *  classify with confidence are excluded, which keeps the thin-content gate
 *  honest. */
export function tourMatchesIntent(tour: TourFilterShape, intent: IntentSlug): boolean {
  const category = (tour.category || '').toLowerCase();
  const desc = (tour.description || '').toLowerCase();
  const name = (tour.name || '').toLowerCase();
  const haystack = `${name} ${desc}`;
  const duration = typeof tour.duration_days === 'number' ? tour.duration_days : null;
  const priceNum = typeof tour.price === 'number' ? tour.price : Number(tour.price) || 0;

  switch (intent) {
    case 'food-tours':
      return category.includes('food') || category.includes('wine') || /\b(food|wine|cooking|tasting|culinary|gastronomy)\b/.test(haystack);
    case 'walking-tours':
      return (
        (category.includes('city') || category.includes('cultural') || category.includes('walking')) &&
        (duration === null || duration <= 1)
      ) || /\bwalking tour\b/.test(haystack);
    case 'multi-day':
      return duration !== null && duration >= 2;
    case 'half-day':
      return duration === 1 || /\bhalf[- ]day\b/.test(haystack);
    case 'budget':
      return priceNum > 0 && priceNum < 100;
    case 'luxury':
      return priceNum >= 250 || /\b(luxury|premium|exclusive|vip)\b/.test(haystack);
    case 'private':
      return /\bprivate (tour|guide|experience)\b/.test(haystack);
    case 'with-kids':
      return /\b(family|kids?|children|child[- ]friendly|family[- ]friendly)\b/.test(haystack);
    case 'free-tours':
      return priceNum === 0 || /\bfree (walking )?tour\b/.test(haystack);
    default:
      return false;
  }
}
