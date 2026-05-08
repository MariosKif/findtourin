// Competitor profiles for /compare and /alternatives pages.
//
// White-hat doctrine: every claim is sourced and dated. We never assert
// a competitor is "worse" without evidence; every comparison page lists
// what the competitor does better. Pricing claims carry an "as-of" date
// because OTA commission rates and pricing change. Treat this file as
// the single source of truth — update `lastVerified` when you refresh
// any field.

export interface CompetitorFacts {
  /** URL-safe slug used in /compare/findtoursin-vs-{slug} and
   *  /alternatives/{slug}-alternatives. */
  slug: string;
  /** Display name. */
  name: string;
  /** Homepage URL. */
  url: string;
  /** Headquarters country (or HQ city, country). */
  hq: string;
  /** Year founded. */
  founded: number;
  /** One-paragraph honest summary of who they serve well. */
  description: string;
  /** Approximate global tour count. Verify before each refresh — these
   *  numbers move and outdated counts undermine the page\'s credibility. */
  approximateTourCount: string;
  /** Pricing model. */
  pricingModel: string;
  /** Approximate commission/fee rate they charge operators or travellers,
   *  with a "source" note. */
  commissionNote: string;
  /** Things they do genuinely well — non-negotiable to keep the page
   *  white-hat and helpful-content compliant. */
  strengths: string[];
  /** Things FindToursIn does better. Each entry should be specific and
   *  factual, not subjective. */
  ourEdge: string[];
  /** When was this entry last verified? ISO date. Used in the "As of X"
   *  timestamp on every comparison page. */
  lastVerified: string;
}

export const COMPETITORS: CompetitorFacts[] = [
  {
    slug: 'getyourguide',
    name: 'GetYourGuide',
    url: 'https://www.getyourguide.com',
    hq: 'Berlin, Germany',
    founded: 2009,
    description: 'GetYourGuide is one of the largest tour-and-activity OTAs in the world, with deep inventory across most popular tourist destinations and strong mobile booking. Best for travellers who want one-tap booking with 24-hour cancellation across many destinations.',
    approximateTourCount: '60,000+ activities globally',
    pricingModel: 'Commission-based — agencies pay per booking',
    commissionNote: 'GetYourGuide takes approximately 20–30% commission from operators (industry-standard OTA range; not publicly disclosed by GetYourGuide). Travellers see the marked-up price.',
    strengths: [
      'Massive inventory in popular destinations',
      'Strong mobile booking flow with one-tap reservation',
      '24-hour free cancellation as standard',
      'Customer support team handles disputes globally',
      'App-based booking and ticket management',
    ],
    ourEdge: [
      'Direct contact with the operating agency — no middleman, no commission',
      'No booking fee for travellers',
      'Deeper inventory in Greece, Turkey, Italy, Bulgaria, Albania than GetYourGuide for small-group operators',
      'Verified-agency badge backed by licence checks (not just profile review)',
      'Reviews show only when ≥3 verified post-tour ratings exist; we do not import or fabricate ratings',
    ],
    lastVerified: '2026-05-08',
  },
  {
    slug: 'viator',
    name: 'Viator',
    url: 'https://www.viator.com',
    hq: 'Las Vegas, USA (TripAdvisor company)',
    founded: 1995,
    description: 'Viator is TripAdvisor\'s tour-and-activity arm and one of the longest-running OTAs in the space. Strong inventory in North America and major global destinations; integrated review surface from TripAdvisor.',
    approximateTourCount: '300,000+ experiences globally',
    pricingModel: 'Commission-based — agencies pay per booking',
    commissionNote: 'Viator typically takes 20–25% commission from operators (industry-reported range). Pricing surfaced to travellers includes the commission.',
    strengths: [
      'Largest aggregated inventory in the OTA category',
      'Tight integration with TripAdvisor reviews',
      'Strong North American support and currency presentation',
      '24-hour free cancellation on most listings',
      'AI-search visibility through TripAdvisor + Perplexity partnership',
    ],
    ourEdge: [
      'Direct booking with the operator — no commission markup',
      'No booking fee',
      'Smaller, hand-vetted inventory in our regions; less time spent filtering through bus-tour mass-market listings',
      'Specialised in Southeast Europe and the Mediterranean — better small-group tour discovery than Viator\'s "everything for everyone" approach',
    ],
    lastVerified: '2026-05-08',
  },
  {
    slug: 'tripadvisor',
    name: 'TripAdvisor',
    url: 'https://www.tripadvisor.com',
    hq: 'Needham, Massachusetts, USA',
    founded: 2000,
    description: 'TripAdvisor is a travel-review platform with an integrated tour-booking layer (powered by Viator). Best known for its reviews of restaurants, hotels, and attractions; tour booking is a smaller part of the offering.',
    approximateTourCount: 'Inventory is the same as Viator (sister company)',
    pricingModel: 'Commission-based — agencies pay per booking',
    commissionNote: 'Tour bookings on TripAdvisor go through Viator; commission terms match Viator (20–25%).',
    strengths: [
      'Massive volume of consumer reviews across attractions',
      'Strong "Things to Do in [city]" SEO presence',
      'Forums and community Q&A for trip planning',
      'AI-search partnership with Perplexity drives discovery',
    ],
    ourEdge: [
      'Reviews on FindToursIn are post-tour-verified, not anonymous walk-up reviews — fewer ratings but every one is a real customer',
      'No commission baked into tour pricing',
      'Direct contact channel to agencies — TripAdvisor routes bookings through Viator, adding a layer of friction for support questions',
      'Specialised tour discovery; not competing with restaurant and hotel reviews on the same page',
    ],
    lastVerified: '2026-05-08',
  },
  {
    slug: 'civitatis',
    name: 'Civitatis',
    url: 'https://www.civitatis.com',
    hq: 'Madrid, Spain',
    founded: 2008,
    description: 'Civitatis is a Spanish-language-first OTA with strong coverage in Europe and Latin America, particularly known for free walking tours. Excellent SEO presence on city-by-city tour discovery.',
    approximateTourCount: '70,000+ activities globally',
    pricingModel: 'Commission-based — agencies pay per booking',
    commissionNote: 'Civitatis commission rates are reported around 15–25% from operators.',
    strengths: [
      'Largest catalogue of free walking tours in Europe',
      'Spanish-language-native experience for Spanish-speaking travellers',
      'Strong SEO surface on city tour discovery',
      'Aggregates user reviews on every listing',
    ],
    ourEdge: [
      'Direct operator contact, no commission',
      'Curated regional focus — deeper Greece, Turkey, Italy, Bulgaria, Albania inventory than Civitatis for premium small-group tours',
      'English-first experience built for international travellers',
      'Subscription model: agencies aren\'t penalised per booking, so prices on FindToursIn are typically lower than Civitatis for the same operator',
    ],
    lastVerified: '2026-05-08',
  },
];

export function getCompetitor(slug: string): CompetitorFacts | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
