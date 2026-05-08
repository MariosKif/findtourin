// Pre-publish SEO scorer for tour listings. Run against any tour record
// (in-form during agency editing, batch on existing tours via the admin
// dashboard) to produce a 0-100 score and a list of specific fixes.
//
// The scoring rubric reflects what Google's helpful-content system and
// the AI engines (ChatGPT, Perplexity) reward in tour-detail content:
// substantive descriptions, real photos with alt text, accurate pricing,
// duration set, focus city/country/category populated.
//
// Designed to be UI-friendly: each issue carries a severity (`error` /
// `warning` / `info`) and a one-sentence fix. The form can render a
// checklist; agencies see the score climb as they fill the listing in.

export type Severity = 'error' | 'warning' | 'info';

export interface SeoIssue {
  severity: Severity;
  /** Field this issue applies to. UI can highlight the corresponding input. */
  field: 'name' | 'description' | 'price' | 'currency' | 'images' | 'duration_days' | 'category' | 'country' | 'city' | 'agency';
  /** One-sentence fix the agency can act on directly. */
  message: string;
  /** Points subtracted from 100 when this issue is present. */
  points: number;
}

export interface SeoScore {
  /** 0-100. ≥80 is publishable, 60-79 is borderline, <60 should be blocked. */
  score: number;
  /** All issues found, ordered by severity then points. */
  issues: SeoIssue[];
  /** Quick verdict label for UI badges. */
  verdict: 'ready' | 'borderline' | 'needs-work';
}

interface ScoringInput {
  name?: string | null;
  description?: string | null;
  price?: number | string | null;
  currency?: string | null;
  duration_days?: number | null;
  category?: string | null;
  country?: string | null;
  city?: string | null;
  images?: { url?: string; alt_text?: string; altText?: string }[] | null;
  agency_id?: string | null;
}

const RULES = {
  // Title needs a real keyword + location signal. Sub-30 chars rarely
  // contains both; over 80 gets truncated in SERPs.
  TITLE_TOO_SHORT: 30,
  TITLE_TOO_LONG: 80,
  // Description below 250 chars rarely produces enough material for
  // schema.org Product description, AI-Overview eligibility, or unique
  // city-page filtering.
  DESC_MIN: 250,
  DESC_TARGET: 600,
  // 3+ images is the threshold for a respectable gallery and for the
  // image-array we put into Product schema.
  IMAGES_MIN: 3,
  IMAGES_TARGET: 6,
};

export function scoreTourSeo(tour: ScoringInput): SeoScore {
  const issues: SeoIssue[] = [];

  // --- Title ---
  const name = (tour.name || '').trim();
  if (!name) {
    issues.push({ severity: 'error', field: 'name', message: 'Tour name is required.', points: 25 });
  } else {
    if (name.length < RULES.TITLE_TOO_SHORT) {
      issues.push({ severity: 'warning', field: 'name', message: `Tour name is ${name.length} characters; aim for 30-70 with the destination and a key activity.`, points: 8 });
    }
    if (name.length > RULES.TITLE_TOO_LONG) {
      issues.push({ severity: 'warning', field: 'name', message: `Tour name is ${name.length} characters and will be truncated in Google results. Trim to 70 or fewer.`, points: 5 });
    }
  }

  // --- Description ---
  const desc = (tour.description || '').trim();
  if (!desc) {
    issues.push({ severity: 'error', field: 'description', message: 'Description is required (aim for 400-800 characters).', points: 25 });
  } else {
    if (desc.length < RULES.DESC_MIN) {
      issues.push({ severity: 'warning', field: 'description', message: `Description is ${desc.length} characters; expand to ≥${RULES.DESC_MIN} so Google has enough text to surface this tour for varied queries.`, points: 12 });
    } else if (desc.length < RULES.DESC_TARGET) {
      issues.push({ severity: 'info', field: 'description', message: `Description could be richer (${desc.length} chars; target ${RULES.DESC_TARGET}+). Add the itinerary highlights, what's included, and the kind of traveller this suits.`, points: 4 });
    }
    // Encourage including itinerary signals — anything that mentions hours,
    // days, distance, lunch, sites is more substantive than marketing copy.
    const substantive = /\b(hour|hours|day|days|km|km\s|lunch|breakfast|dinner|stops?|visits?|includes?|guide|guided|pickup|transfer)\b/i.test(desc);
    if (!substantive && desc.length >= RULES.DESC_MIN) {
      issues.push({ severity: 'info', field: 'description', message: 'Description reads as marketing copy. Add concrete details: hours, distance, included meals, pickup, what travellers actually do.', points: 4 });
    }
  }

  // --- Price + currency ---
  const priceNum = typeof tour.price === 'number' ? tour.price : Number(tour.price);
  if (!priceNum || !Number.isFinite(priceNum) || priceNum <= 0) {
    issues.push({ severity: 'error', field: 'price', message: 'Set a starting price; Product schema will not fire without one.', points: 15 });
  }
  if (!tour.currency) {
    issues.push({ severity: 'warning', field: 'currency', message: 'Currency missing; defaults to EUR but should be set explicitly.', points: 3 });
  }

  // --- Location ---
  if (!tour.country) {
    issues.push({ severity: 'error', field: 'country', message: 'Country is required (drives country/city hubs).', points: 12 });
  }
  if (!tour.city) {
    issues.push({ severity: 'warning', field: 'city', message: 'City is missing; without it the tour cannot appear in city hubs or intent pages (huge traffic loss).', points: 10 });
  }

  // --- Category ---
  if (!tour.category) {
    issues.push({ severity: 'warning', field: 'category', message: 'Category missing; required for category-by-country hubs and Product schema enrichment.', points: 6 });
  }

  // --- Duration ---
  if (typeof tour.duration_days !== 'number' || tour.duration_days <= 0) {
    issues.push({ severity: 'info', field: 'duration_days', message: 'Duration not set; without it the tour is excluded from day-trip and multi-day intent pages.', points: 5 });
  }

  // --- Images ---
  const images = (tour.images || []).filter((i) => typeof i?.url === 'string' && i.url.length > 0);
  if (images.length === 0) {
    issues.push({ severity: 'error', field: 'images', message: 'At least one tour image is required (Google rejects Product rich results without a real image).', points: 15 });
  } else if (images.length < RULES.IMAGES_MIN) {
    issues.push({ severity: 'warning', field: 'images', message: `Only ${images.length} image(s); add at least ${RULES.IMAGES_MIN - images.length} more for a respectable gallery.`, points: 5 });
  } else if (images.length < RULES.IMAGES_TARGET) {
    issues.push({ severity: 'info', field: 'images', message: `${images.length} images is fine; ${RULES.IMAGES_TARGET}+ improves CTR and accessibility.`, points: 2 });
  }

  // --- Alt text ---
  const altMissing = images.filter((i) => !i.alt_text && !i.altText).length;
  if (images.length > 0 && altMissing > 0) {
    issues.push({
      severity: 'warning',
      field: 'images',
      message: `${altMissing} of ${images.length} image(s) missing alt text. Alt text affects accessibility, SEO image search, and Google Image Search ranking.`,
      points: Math.min(8, altMissing * 2),
    });
  }

  // --- Agency ---
  if (!tour.agency_id) {
    issues.push({ severity: 'info', field: 'agency', message: 'No agency linked; the listing will display under the FindToursIn brand instead of the operator (weakens E-E-A-T).', points: 3 });
  }

  // Sort: errors first, then warnings, then info; within each, by points desc.
  const severityRank: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.points - a.points);

  const totalDeductions = issues.reduce((s, i) => s + i.points, 0);
  const score = Math.max(0, 100 - totalDeductions);
  const verdict: SeoScore['verdict'] = score >= 80 ? 'ready' : score >= 60 ? 'borderline' : 'needs-work';

  return { score, issues, verdict };
}
