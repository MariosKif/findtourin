// "Best of / Top N" curated listings. Editorial picks ranked with explicit
// reasoning — the format that converts at 3-5x generic listing pages and
// dominates "best X" SERP queries.
//
// Each entry below uses tour SLUGS (live tours from the DB). When a tour
// is removed from the DB, the listicle simply skips it at render time —
// the gate in /best/[topic].astro requires ≥3 valid tours to ship.

export interface BestOfPick {
  /** Tour slug — must match a live tours.slug. */
  slug: string;
  /** Why we ranked it here (1–2 sentences). The lift LLMs cite. */
  rationale: string;
  /** Optional callout label like "Best for couples" or "Editor's pick". */
  callout?: string;
}

export interface BestOfList {
  /** URL slug for /best/[slug]. */
  slug: string;
  /** Page title (year-stamped at render time). */
  title: string;
  /** Sub-150-char meta description. */
  description: string;
  /** 1-line tagline rendered under the H1. */
  tagline: string;
  /** Date last hand-reviewed by editorial. */
  updated: string;
  /** Lead passage rendered as the speakable key takeaway. */
  intro: string;
  /** Ranked list — order matters; first entry is the editorial #1. */
  picks: BestOfPick[];
  /** 4-6 FAQs that close the page. */
  faqs: { q: string; a: string }[];
  /** Internal link suggestions at the end. */
  related: { href: string; label: string }[];
  /** Country/region this list is about. Drives breadcrumb + about[].
   *  Use the canonical country name as it appears in the tours table. */
  country?: string;
}

export const BEST_OF: BestOfList[] = [
  {
    slug: 'best-greece-tours',
    title: 'Best Greece Tours',
    description: 'The strongest Greece tours on FindToursIn — editorially ranked with reasoning. Mainland circuits, island hops, food tours, and day-trip standouts for 2026.',
    tagline: 'Editorially ranked picks across mainland and islands',
    updated: '2026-05-08',
    country: 'Greece',
    intro: 'Greece runs the gamut from the Acropolis-and-Plaka standards to mountain-monastery hikes through Meteora and Zagori — and most "best of" lists treat the whole country as if you should see it in 5 days. We don\'t. Below, the strongest Greece tours on FindToursIn ranked by what they actually deliver: itinerary depth, agency reliability, and price-to-value. Updated annually.',
    picks: [
      {
        slug: 'meteora-rock-climbing',
        rationale: 'Meteora\'s rock pillars are unmatched in Greece for sheer visual impact, and a guided climbing or hiking experience — not a coach drive-through — is the only way to do them justice. Modest dress is required at every monastery.',
        callout: 'Editor\'s pick · Mainland',
      },
      {
        slug: 'santorini-wine-tour',
        rationale: 'Santorini\'s volcanic-soil vineyards (Pyrgos, Megalochori, Santo Wines) produce some of Greece\'s most distinctive whites — Assyrtiko at its origin. A 3–4 hour wine-region tour is the perfect counter to the caldera-edge tourist crush in Oia.',
        callout: 'Best for islands',
      },
      {
        slug: 'athens-acropolis-tour',
        rationale: 'The Acropolis at peak season is brutal solo; a guided walk that pre-books skip-the-line entries and adds Plaka, Anafiotika, and ancient Agora context elevates a tick-box into a half-day worth remembering.',
        callout: 'Best for cities',
      },
      {
        slug: 'samaria-gorge-hike',
        rationale: 'The 16 km Samaria Gorge is one of Europe\'s great single-day walks — a guided hike handles the dawn ferry timing back from Agia Roumeli and the Cretan-coast pickup that catches independent walkers out.',
        callout: 'Best multi-day',
      },
      {
        slug: 'mykonos-delos-cruise',
        rationale: 'A small-boat day from Mykonos visiting Delos is the rare island day trip that earns its premium — Delos is one of Greece\'s most underrated archaeological sites and impossible to reach on a coach tour.',
        callout: 'Best boat day',
      },
    ],
    faqs: [
      { q: 'What is the single best Greece tour for first-time visitors?', a: 'For first-time visitors, a multi-day Athens + Meteora itinerary delivers the highest-impact mix of urban antiquity and visual landscape Greece offers. Add 3 days on a Cycladic island (Santorini or Naxos) to round out the country.' },
      { q: 'When should I book a Greece tour?', a: 'For July–August peak season, book 8–12 weeks ahead — small-group tours sell out earliest. June and September are bookable 4–6 weeks out; April–May and October are usually 1–3 weeks out except over Greek Easter.' },
      { q: 'Are Greece tours worth the cost?', a: 'For Meteora, the Greek mainland circuit, and multi-day island combinations — yes, because logistics and access matter. For walkable city centres like Athens, a guided half-day pays for itself in skip-the-line value but a full multi-day Athens-only tour usually doesn\'t.' },
      { q: 'How much do Greece tours cost in 2026?', a: 'Group day tours from Athens or on the islands run €60–140 per person. Multi-day group tours run €600–1,400 per person all-in (land-only). Premium small-group multi-day options run €1,500–3,000 per person.' },
      { q: 'Is it better to do a Greece tour or self-guided trip?', a: 'A hybrid model wins for most travellers: self-guided in Athens and on the islands, guided for Meteora, Delphi, and any mainland-circuit days where logistics get heavy. You pay 30–50% of a fully-guided trip and keep most of the upside.' },
    ],
    related: [
      { href: '/tours/in/greece', label: 'All tours in Greece' },
      { href: '/itineraries/greece/7-days', label: 'Greece 7-day itinerary' },
      { href: '/blog/best-greece-tours-summer-2026', label: 'Best Greece tours 2026 (blog)' },
      { href: '/guide/best-time-to-visit-greece', label: 'Best time to visit Greece' },
    ],
  },

  {
    slug: 'best-day-trips-from-athens',
    title: 'Best Day Trips from Athens',
    description: 'The strongest day trips from Athens — Cape Sounion, Delphi, Argolida, Saronic islands, and Meteora as a long day. Editorially ranked with timing notes.',
    tagline: 'Cape Sounion to Meteora — the editorial ranking',
    updated: '2026-05-08',
    country: 'Greece',
    intro: 'Athens is the best base in mainland Greece for day trips — a single morning departure can reach Cape Sounion (90 minutes south), Delphi (2.5 hours northwest), or any of the Saronic islands by ferry from Piraeus. Below, the strongest day-trip options ranked by editorial impact and traveller fit. Most run 8–12 hours door-to-door.',
    picks: [
      {
        slug: 'delphi-oracle-tour',
        rationale: 'Delphi is the highest-impact single-day trip from Athens — the oracle site\'s setting on Mount Parnassus, the museum\'s collection, and the depth of a guided visit beat any coastal alternative. A full 10-hour day with hotel pickup.',
        callout: 'Editor\'s pick',
      },
      {
        slug: 'meteora-rock-climbing',
        rationale: 'Meteora as a single day from Athens is a long 14-hour push, but the cliff-top monasteries justify it. Most travellers prefer to overnight nearby — the day-trip version is for tight schedules.',
        callout: 'Long-haul',
      },
      {
        slug: 'mount-olympus-summit',
        rationale: 'Mount Olympus is the rare alpine day trip from a Mediterranean capital. The summit attempt is multi-day, but the lower trails work as a long single-day excursion for fit travellers.',
        callout: 'For hikers',
      },
    ],
    faqs: [
      { q: 'What is the best day trip from Athens?', a: 'Delphi is the highest-impact single-day trip from Athens for travellers focused on archaeology and landscape. For a relaxed alternative, the Saronic-ferry day to Hydra and Aegina wins on pure travel comfort.' },
      { q: 'Can I do Meteora as a day trip from Athens?', a: 'Yes — by train or coach. Single-day Meteora trips leave Athens around 7am and return after 9pm. Most travellers prefer a 2-day overnight to avoid 8 hours of return travel in a day, but the day option is workable.' },
      { q: 'How much do day trips from Athens cost?', a: 'Group day trips from Athens start around €70 (Cape Sounion) and rise to €100–140 for Delphi, Argolida, or Saronic-island combinations. Private day trips for two start around €350.' },
      { q: 'When is the best time of year for Athens day trips?', a: 'April–May and September–October are ideal — mainland sites are pleasant temperatures (18–25°C) and crowds are 30-40% below July-August peak. Cape Sounion is good year-round.' },
    ],
    related: [
      { href: '/day-trips-from/athens', label: 'All day trips from Athens' },
      { href: '/tours/in/greece/athens', label: 'Tours in Athens' },
      { href: '/blog/athens-day-trips-2026', label: 'Athens day trips guide (blog)' },
    ],
  },

  {
    slug: 'best-food-tours-in-italy',
    title: 'Best Food Tours in Italy',
    description: 'The strongest Italian food tours — Rome\'s Trastevere, Florence\'s Mercato Centrale, Bologna\'s pasta-making — editorially ranked with what each tour actually delivers.',
    tagline: 'From Rome trattorias to Bologna pasta classes',
    updated: '2026-05-08',
    country: 'Italy',
    intro: 'Italian food tours range from tasting walks through Rome\'s Trastevere to hands-on pasta-making classes in Bologna and the Tuscan countryside. The best ones do three things at once: introduce shopkeepers personally, calibrate tastings as a meal (not as snacks), and explain regional cooking in a way the menu translation can\'t. Below, the strongest Italian food tours on FindToursIn ranked by editorial impact.',
    picks: [
      {
        slug: 'tuscany-cooking-class',
        rationale: 'Tuscan cooking classes are the most-cited Italian food experience for travellers, and a half-day pasta-and-sauce class with a regional lunch beats most tasting walks. 4 hours, your meal is what you cook.',
        callout: 'Editor\'s pick · Hands-on',
      },
      {
        slug: 'crete-olive-oil-raki',
        rationale: 'Crete\'s olive-oil mills and raki distilleries are an under-the-radar Mediterranean food experience — closer in spirit to an Italian agriturismo day than a tourist food walk. Pair with the Samaria Gorge for a perfect 2-day Cretan combo.',
        callout: 'Underrated',
      },
      {
        slug: 'tuscany-thermal-baths',
        rationale: 'Italian food is inseparable from regional rhythm — a Tuscan thermal-baths day pairs lunch at a hilltop trattoria with afternoon recovery in Saturnia\'s natural pools. The slowest, most regional way to eat in Italy.',
        callout: 'Slow-Italy',
      },
    ],
    faqs: [
      { q: 'What is the best food tour in Italy?', a: 'Rome\'s Trastevere food walk is the highest-impact single food tour in Italy — the neighbourhood\'s density of family trattorias and the guide\'s relationships with the owners make it stand apart from a generic food crawl.' },
      { q: 'How long are Italian food tours?', a: 'Most Italian food tours run 3-4 hours with 6-10 tasting stops. Hands-on cooking classes run 3-5 hours and your meal is what you cook — both formats count as dinner.' },
      { q: 'How much do food tours in Italy cost?', a: 'Group food tours start around €70 per person; premium and private experiences with wine pairings or cooking-class formats run €120-200. Hands-on Bologna pasta classes are €80-130 per person.' },
      { q: 'Are Italian food tours suitable for vegetarians?', a: 'Yes — most operators offer dedicated vegetarian variants or adapt the standard route with 24-48 hours notice. Confirm dietary needs at booking; in Italy this is usually accommodated easily.' },
    ],
    related: [
      { href: '/tours/in/italy', label: 'All tours in Italy' },
      { href: '/tours/in/italy/rome/food-tours', label: 'Rome food tours' },
      { href: '/itineraries/italy/7-days', label: 'Italy 7-day itinerary' },
    ],
  },
];

export function getBestOfList(slug: string): BestOfList | undefined {
  return BEST_OF.find((b) => b.slug === slug);
}
