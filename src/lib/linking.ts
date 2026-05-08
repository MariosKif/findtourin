// Internal-linking automation. Centralises the `<a href>` targets we sprinkle
// across hubs/tour pages so we can change the linking strategy in one place,
// and so the sitemap and the linking layer stay in sync.
//
// White-hat note: every link emitted by this module points at a page that is
// known to exist (or is gated by shouldIndex elsewhere). We never link to a
// page we expect to 404 — that erodes crawl budget.

import { slugify } from './destinations';
import { INTENT_SLUGS, type IntentSlug, humanIntent } from './programmatic';

export interface RelatedLink {
  href: string;
  label: string;
  /** Optional category for grouping ("city", "intent", "category", "guide"). */
  group?: string;
}

/** Build the standard set of related-content links for a city hub.
 *  Returns intent variants that we already know exist (caller still needs
 *  to filter via shouldIndex if it wants to be paranoid). */
export function cityRelatedLinks(args: {
  countrySlug: string;
  citySlug: string;
  cityName: string;
  /** Intents that have ≥3 matching tours for this city — only these are linked. */
  availableIntents?: IntentSlug[];
}): RelatedLink[] {
  const { countrySlug, citySlug, cityName, availableIntents = [] } = args;
  const links: RelatedLink[] = [];
  for (const intent of availableIntents) {
    if (!(INTENT_SLUGS as readonly string[]).includes(intent)) continue;
    links.push({
      href: `/tours/in/${countrySlug}/${citySlug}/${intent}`,
      label: `${humanIntent(intent)} in ${cityName}`,
      group: 'intent',
    });
  }
  return links;
}

/** Day-trip page link for a city, when day trips are available. */
export function dayTripLink(args: { citySlug: string; cityName: string }): RelatedLink {
  return {
    href: `/day-trips-from/${args.citySlug}`,
    label: `Day trips from ${args.cityName}`,
    group: 'day-trip',
  };
}

/** Up to N nearby-city links for cross-linking inside a country. Caller
 *  passes the city list (already filtered to indexable hubs). */
export function nearbyCityLinks(args: {
  countrySlug: string;
  cities: { name: string }[];
  excludeCity?: string;
  limit?: number;
}): RelatedLink[] {
  const { countrySlug, cities, excludeCity, limit = 6 } = args;
  return cities
    .filter((c) => !excludeCity || slugify(c.name) !== excludeCity)
    .slice(0, limit)
    .map((c) => ({
      href: `/tours/in/${countrySlug}/${slugify(c.name)}`,
      label: `Tours in ${c.name}`,
      group: 'city',
    }));
}

/** Category × country cross-links. */
export function categoryLinks(args: {
  countrySlug: string;
  countryName: string;
  categories: { name: string }[];
  limit?: number;
}): RelatedLink[] {
  const { countrySlug, countryName, categories, limit = 8 } = args;
  return categories.slice(0, limit).map((c) => ({
    href: `/tours/category/${slugify(c.name)}/in/${countrySlug}`,
    label: `${c.name} tours in ${countryName}`,
    group: 'category',
  }));
}
