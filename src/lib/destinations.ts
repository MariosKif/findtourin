// Helpers + copy for destination landing pages (/tours/in/[country], /tours/in/[country]/[city]).

export const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Reverse a slug to possible original strings (case-insensitive match against DB).
// Used when a user navigates to /tours/in/greece — we match against any country where slugify(country) === 'greece'.
export const matchBySlug = <T extends Record<string, any>>(
  items: T[],
  slug: string,
  key: keyof T,
): T | undefined => items.find((i) => slugify(String(i[key])) === slug);

export interface CountryCopy {
  name: string;
  tagline: string;
  intro: string;
  whenToVisit: string;
  mustSee: string[];
  heroImage: string;
}

// Hand-written SEO copy for the main countries we cover. Any country not listed
// still gets a page via the generic fallback (see buildCountryCopy).
export const COUNTRY_COPY: Record<string, CountryCopy> = {
  greece: {
    name: 'Greece',
    tagline: 'Ancient history, blue-domed islands, and Mediterranean flavour',
    intro:
      'From the whitewashed caldera of Santorini to the mountain villages of Zagori, Greece packs more heritage into one country than almost anywhere else. Our partner agencies run small-group tours across the mainland and islands — wine tasting in Nemea, sunrise hikes on Mount Olympus, sailing the Cyclades, mythology tours of Delphi.',
    whenToVisit:
      'Peak season is May through September, with July and August the warmest and busiest. Shoulder months (April–May, September–October) are ideal for hiking and sightseeing without the heat or crowds.',
    mustSee: ['Santorini caldera', 'Acropolis of Athens', 'Meteora monasteries', 'Mykonos beaches', 'Delphi ruins', 'Zagori stone villages'],
    heroImage: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=2000&h=900&fit=crop',
  },
  turkey: {
    name: 'Turkey',
    tagline: 'Bridging Europe and Asia, from Istanbul to Cappadocia',
    intro:
      "Turkey packs Roman ruins, Ottoman palaces, and surreal volcanic landscapes into a single trip. Local agencies on FindToursIn run small-group tours from Istanbul's bazaars to the hot-air-balloon dawns of Cappadocia and the Lycian coast's blue-cruise sailing.",
    whenToVisit:
      'April-June and September-October offer the best weather for sightseeing. July-August is ideal for the Aegean coast but very hot inland.',
    mustSee: ['Hagia Sophia', 'Cappadocia balloon flights', 'Ephesus ruins', 'Pamukkale', 'Lycian Way trek', 'Bosphorus cruise'],
    heroImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=2000&h=900&fit=crop',
  },
  italy: {
    name: 'Italy',
    tagline: 'Renaissance art, alpine lakes, and the world\'s most loved cuisine',
    intro:
      "From Roman antiquity to Renaissance masterpieces, alpine treks to Amalfi cliffs, Italy offers the densest cultural payload per mile in Europe. Agencies on FindToursIn lead expert-guided tours through the Vatican, Tuscan vineyards, the Cinque Terre coast, and Sicilian volcanoes.",
    whenToVisit:
      'May-June and September-October bring warm days and lighter crowds. July-August is peak coastal season; winter is best for cities and the Dolomites.',
    mustSee: ['Colosseum & Roman Forum', 'Vatican Museums', 'Florence Duomo', 'Cinque Terre', 'Amalfi Coast', 'Pompeii & Mount Vesuvius'],
    heroImage: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=2000&h=900&fit=crop',
  },
  bulgaria: {
    name: 'Bulgaria',
    tagline: 'Medieval fortresses, Black Sea beaches, mountain trails',
    intro:
      'Bulgaria remains one of Europe\'s best-value destinations. Visit the medieval capital of Veliko Tarnovo, hike in the Rila mountains, or sample rose-valley spa experiences with local Bulgarian agencies.',
    whenToVisit:
      'May through October is best for sightseeing and hiking. Winter (December–March) is prime for skiing in Bansko and Borovets.',
    mustSee: ['Tsarevets Fortress', 'Rila Monastery', 'Seven Rila Lakes', 'Plovdiv Old Town', 'Rose Valley', 'Sunny Beach coast'],
    heroImage: '/images/veliko.jpg',
  },
  albania: {
    name: 'Albania',
    tagline: 'Europe\'s last undiscovered coastline',
    intro:
      'Albania\'s Ionian coast rivals the Greek islands — minus the crowds and the prices. From Ksamil\'s turquoise bays to the Unesco-listed town of Berat, it\'s one of the most rewarding emerging destinations in Europe.',
    whenToVisit:
      'June through September for beaches, April–May and October for inland sightseeing and hiking.',
    mustSee: ['Ksamil beaches', 'Berat Old Town', 'Butrint ruins', 'Albanian Riviera', 'Theth National Park', 'Gjirokaster'],
    heroImage: 'https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=2000&h=900&fit=crop',
  },
};

export function getCountryCopy(name: string): CountryCopy {
  const existing = COUNTRY_COPY[slugify(name)];
  if (existing) return existing;
  return {
    name,
    tagline: `Curated tours across ${name}`,
    intro: `Discover tours in ${name} from trusted local agencies. Browse itineraries, prices, and dates — then contact the agency directly to book.`,
    whenToVisit: `Tour availability in ${name} varies by agency and season. Check individual listings for start dates and durations.`,
    mustSee: [],
    heroImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2000&h=900&fit=crop',
  };
}

export interface CityCopy {
  name: string;
  country: string;
  tagline: string;
  intro: string;
  bestFor: string[];
}

export const CITY_COPY: Record<string, Partial<CityCopy>> = {
  santorini: { tagline: 'Sunsets, caldera views, volcanic hot springs', bestFor: ['Couples', 'Sunset photography', 'Wine tasting', 'Spa & wellness'] },
  mykonos: { tagline: 'Beach clubs, windmills, Cycladic charm', bestFor: ['Beach days', 'Nightlife', 'Sailing', 'Food tours'] },
  corfu: { tagline: 'Lush Ionian island with Venetian heritage', bestFor: ['Beach holidays', 'Hiking', 'Wellness retreats', 'Historical tours'] },
  crete: { tagline: 'Mountains, gorges, and Minoan ruins', bestFor: ['Hiking & trekking', 'Archaeology', 'Food & wine', 'Road trips'] },
  athens: { tagline: 'Ancient capital of democracy and philosophy', bestFor: ['Historical tours', 'Food walking tours', 'Museums', 'Day trips'] },
  delphi: { tagline: 'Sanctuary of Apollo and navel of the ancient world', bestFor: ['Day trips', 'Archaeology', 'Mythology tours'] },
  meteora: { tagline: 'Cliff-top monasteries in a rock-pillar landscape', bestFor: ['Day trips', 'Photography', 'Hiking'] },
  rhodes: { tagline: 'Medieval old town and sun-drenched beaches', bestFor: ['Historical tours', 'Beach days', 'Island hopping'] },
  zakynthos: { tagline: 'Turquoise bays and shipwreck beach', bestFor: ['Boat tours', 'Beach days', 'Snorkelling'] },
  heraklion: { tagline: 'Gateway to Crete and the Minoan palace of Knossos', bestFor: ['Archaeology', 'Day trips', 'Food tours'] },
  ioannina: { tagline: 'Lakeside city and base for Zagori treks', bestFor: ['Hiking', 'Nature', 'Cultural tours'] },
  litochoro: { tagline: 'Base camp for Mount Olympus summits', bestFor: ['Trekking', 'Multi-day hikes', 'Adventure'] },
  'veliko-tarnovo': { tagline: 'Medieval capital with fortress and artisan streets', bestFor: ['Historical tours', 'Walking tours', 'Photography'] },
  ksamil: { tagline: 'Albania\'s turquoise beach paradise', bestFor: ['Beach days', 'Boat tours', 'Budget travel'] },
  siena: { tagline: 'Medieval Tuscan city famed for the Palio', bestFor: ['Day trips', 'Wine tasting', 'Architecture'] },
  naples: { tagline: 'Gateway to Pompeii, Herculaneum, and the Amalfi Coast', bestFor: ['Day trips', 'Food tours', 'Archaeology'] },
  'la-spezia': { tagline: 'Starting point for Cinque Terre coastal hikes', bestFor: ['Hiking', 'Coastal tours', 'Day trips'] },
  fethiye: { tagline: 'Turkish Lycian coast — coves, blue cruises, ancient ruins', bestFor: ['Trekking', 'Sailing', 'Paragliding'] },
  izmir: { tagline: 'Aegean base for Ephesus and ancient Ionia', bestFor: ['Archaeology', 'Day trips', 'Food tours'] },
  istanbul: { tagline: 'Crossroads of Europe and Asia', bestFor: ['Historical tours', 'Hammam & spa', 'Food walking tours', 'Bosphorus cruises'] },
};

export function getCityCopy(city: string, country: string): CityCopy {
  const base = CITY_COPY[slugify(city)];
  return {
    name: city,
    country,
    tagline: base?.tagline || `Tours and experiences in ${city}`,
    intro: `Find tours in ${city}, ${country} from trusted local agencies. Browse itineraries, prices, and duration — then contact the agency directly. No booking fees, no commission.`,
    bestFor: base?.bestFor || [],
  };
}

// -----------------------------------------------------------------
// Intent copy — unique editorial blurbs for /tours/in/[country]/[city]/[intent]
// -----------------------------------------------------------------
// Each (city, intent) combination needs its own intro paragraph and FAQ
// answers — that's what keeps the page out of doorway-page classification.
// Generic fallbacks are deliberately thin so that the shouldIndex() gate in
// programmatic.ts excludes them when no curated copy exists.

import type { IntentSlug } from './programmatic';

export interface IntentCopy {
  /** Unique 60-180 word intro, drives passage-level AI citations. */
  intro: string;
  /** 1-line tagline rendered under the H1. */
  tagline: string;
  /** 4 unique FAQ Q&As specific to this (city, intent) combo. */
  faqs: { q: string; a: string }[];
  /** True when this entry is hand-written (curated). False for the generic
   *  fallback — used by shouldIndex() to gate the page. */
  curated: boolean;
}

type IntentCopyMap = Partial<Record<string, Partial<Record<IntentSlug, Omit<IntentCopy, 'curated'>>>>>;

// Hand-written copy. Add a new (city, intent) entry whenever ≥3 tours of
// that intent exist in that city. Anything not listed here falls through to
// a generic stub that is *deliberately* short so the shouldIndex gate
// catches it — we never want a thin doorway live.
const INTENT_COPY: IntentCopyMap = {
  athens: {
    'food-tours': {
      tagline: 'Souvlaki, mezze, and Plaka tavernas with local guides',
      intro:
        'Athens food tours move beyond the tourist menu and into the neighbourhoods locals actually eat in — the Varvakios meat market, Psyrri\'s mezze bars, and the family-run tavernas tucked into Plaka\'s side streets. Most tours run 3–4 hours, mix 6–10 tasting stops, and cover staples like souvlaki, loukoumades, ouzo, and Greek wines from small producers. Walking distance is moderate (2–4 km) and groups are kept small so the guide can introduce you to the shopkeepers personally.',
      faqs: [
        { q: 'How long are food tours in Athens?', a: 'Most Athens food tours run 3 to 4 hours and cover 6–10 tasting stops on foot. Plan for it to count as your dinner — by the end you will not need another meal.' },
        { q: 'Are Athens food tours suitable for vegetarians or vegans?', a: 'Several agencies on FindToursIn run dedicated vegetarian or vegan Athens food tours, and most can adapt with 24–48 hours notice. Confirm dietary needs when contacting the agency.' },
        { q: 'When do food tours in Athens run?', a: 'Athens food tours typically run morning (10–11am) and evening (6–7pm) starts year-round. Evening tours are most popular in summer when daytime heat eases.' },
        { q: 'How much do Athens food tours cost?', a: 'Athens food tours on FindToursIn start around €60 per person for a half-day group walk and rise to €120+ for private or premium experiences with wine pairings.' },
      ],
    },
    'walking-tours': {
      tagline: 'Acropolis, Plaka, and ancient Agora — guided on foot',
      intro:
        'A walking tour is still the best way to read Athens — most of the historic core sits within 2 km of the Acropolis, and ground-level routes pass through layers of Roman, Byzantine, and Ottoman city the metro skips. Standard 3-hour Athens walking tours cover the Acropolis, ancient Agora, Plaka, and Anafiotika; longer 5-hour itineraries add the Kerameikos cemetery, the National Garden, and Lycabettus viewpoints. Most agencies cap groups at 12 and provide skip-the-line entry where it applies.',
      faqs: [
        { q: 'How long is a typical Athens walking tour?', a: 'Athens walking tours on FindToursIn run 3 hours (highlights), 4–5 hours (Acropolis + Agora + Plaka), or full-day variants that add Lycabettus or coastal Piraeus.' },
        { q: 'Do walking tours include Acropolis entry?', a: 'Most Athens walking tours include the guided portion but not the Acropolis ticket itself — confirm with the agency. Pre-booked tickets save 30–60 minutes of queueing in summer.' },
        { q: 'When is the best time of day for an Athens walking tour?', a: 'Early morning (8–9am) starts beat the summer heat and crowds at the Acropolis. Sunset routes that finish on Filopappou Hill are popular November to March.' },
        { q: 'Are Athens walking tours wheelchair accessible?', a: 'The ancient Agora and Plaka have step-free routes, but the Acropolis summit is steep and uneven. Several agencies offer adapted itineraries — message the agency directly to plan an accessible route.' },
      ],
    },
    'multi-day': {
      tagline: 'Athens-based tours over 2+ days, with day-trip excursions',
      intro:
        'Multi-day tours from Athens pair the city\'s headline sites with one or more excursions out — Delphi, Meteora, Cape Sounion, the Argolida (Mycenae, Epidaurus, Nafplio), or the Saronic islands. Standard 3-day itineraries cover Athens highlights plus Delphi or Cape Sounion; 5–7 day Greek-mainland circuits add Meteora and Olympia. Hotels are normally booked separately by the traveller; the tour covers transport, guiding, and entries.',
      faqs: [
        { q: 'What is a typical 3-day Athens itinerary?', a: 'A standard 3-day Athens tour covers the Acropolis and ancient Agora on day 1, a Cape Sounion or Argolida day trip on day 2, and Delphi on day 3.' },
        { q: 'Are accommodations included in multi-day Athens tours?', a: 'Most multi-day Athens tours quote a land-only price covering transport, guides, and entries; hotels are optional or booked separately. Confirm what is included with the agency.' },
        { q: 'How far in advance should I book a multi-day tour?', a: 'For peak season (June–September) book 6–12 weeks ahead — small-group multi-day tours from Athens fill earliest. Shoulder months are usually bookable 2–4 weeks out.' },
        { q: 'Can multi-day Athens tours be customised?', a: 'Yes — most agencies on FindToursIn build private multi-day itineraries on request. Expect 24–48 hours to receive a custom proposal.' },
      ],
    },
  },
  santorini: {
    'walking-tours': {
      tagline: 'Caldera-edge paths from Fira to Oia',
      intro:
        'Santorini\'s most famous walk is the 10 km caldera-edge path from Fira to Oia — three hours of marble steps, blue-domed chapels, and wind-blown viewpoints that no minibus tour replaces. Guided walking tours add context most travellers miss: the volcanic geology, the 17th-century church-bell etiquette, and the difference between a real cave house and a hotel mock-up. Routes can be flipped (Oia → Fira ends at the caldera in time for sunset cocktails) and groups are usually under 10.',
      faqs: [
        { q: 'How hard is the Fira to Oia caldera walk?', a: 'The Fira to Oia path is moderate — 10 km, 200 m elevation gain, and largely on stone steps and dirt track. Plan 3–4 hours including photo stops; bring water and sun protection.' },
        { q: 'Are Santorini walking tours guided in English?', a: 'Yes — every Santorini walking tour on FindToursIn runs in English. Several agencies also offer French, German, Italian, and Greek on request.' },
        { q: 'When is the best time for a Santorini walking tour?', a: 'May, early June, September, and October offer the best walking weather. July and August are doable but plan an early-morning start (7–8am) to avoid mid-day heat.' },
        { q: 'Can I do the Fira–Oia walk without a guide?', a: 'The path is well marked and many people walk it independently. A guided Santorini walking tour adds context and pacing, and most agencies finish near a sunset viewpoint with tickets pre-arranged.' },
      ],
    },
    'multi-day': {
      tagline: '2 to 4-day Santorini itineraries with island add-ons',
      intro:
        'Multi-day Santorini tours pair the caldera with neighbouring islands — most often Mykonos, Naxos, Paros, or a sailing day around the volcano and Thirassia. A typical 3-day base covers the Fira–Oia caldera walk, an Akrotiri archaeological visit, a wine-region tour through Pyrgos and Megalochori, and a catamaran day. Longer 5–7 day itineraries add the smaller islands or pair with Crete via the high-speed ferry from Athinios.',
      faqs: [
        { q: 'How many days are needed in Santorini?', a: '3–4 days is the sweet spot for Santorini — long enough to walk the caldera, do a wine tour, and take a catamaran without rushing. Day-trippers typically only see Fira and Oia.' },
        { q: 'Should I combine Santorini with another island?', a: 'Yes — most Santorini multi-day tours pair with Mykonos, Naxos, or Crete via fast ferry. Allow at least 6 hours total for ferry transfer when planning.' },
        { q: 'Are multi-day Santorini tours private or group?', a: 'Both are common. Group tours run 6–12 travellers and quote €300–700 per person for 3 days. Private tours start around €1,200 for two and scale by group size.' },
        { q: 'When should I book a multi-day Santorini tour?', a: 'For July–August peak season, book 3–4 months ahead — Santorini\'s best small-group tours and caldera-view restaurants sell out earliest.' },
      ],
    },
  },
  istanbul: {
    'food-tours': {
      tagline: 'Bazaar mezze, Bosphorus fish lunches, and back-street bakeries',
      intro:
        'Istanbul food tours stretch across two continents — most start in the spice bazaar, weave through Eminönü, then ferry to Kadıköy on the Asian side for a different rhythm of family bakeries and meyhanes. Expect 8–12 tasting stops over 4–5 hours: simit, Turkish breakfast spreads, kokoreç, baklava, and a glass of Turkish tea or Anatolian wine. Several agencies on FindToursIn run dedicated street-food, vegetarian, and Ottoman-cuisine variants. Walking distance is 3–5 km on uneven streets — wear comfortable shoes.',
      faqs: [
        { q: 'How long are Istanbul food tours?', a: 'Most Istanbul food tours run 4–5 hours with 8–12 tasting stops. Plan it as your lunch and dinner combined — most travellers finish full.' },
        { q: 'Do Istanbul food tours cross to the Asian side?', a: 'The best Istanbul food tours include a ferry crossing to Kadıköy on the Asian side, where prices are lower and the food scene less touristy. Confirm the route with the agency.' },
        { q: 'Are Istanbul food tours alcohol-free?', a: 'Many tours can be configured alcohol-free on request. Standard itineraries include a glass of raki or wine — flag your preference at booking.' },
        { q: 'When do food tours in Istanbul run?', a: 'Most Istanbul food tours start mid-morning (10–11am) or late afternoon (4–5pm) so you taste during local mealtimes. Friday lunch tours align with the bazaar\'s busiest hour.' },
      ],
    },
    'walking-tours': {
      tagline: 'Sultanahmet, Galata, and the Grand Bazaar on foot',
      intro:
        'Istanbul rewards a slow walk — the historic peninsula packs Hagia Sophia, the Blue Mosque, Topkapı Palace, and the Grand Bazaar into 2 km, but the alleys behind them hold most of the story. Standard 4-hour Istanbul walking tours cover Sultanahmet; longer routes add Galata, Karaköy, and the Bosphorus waterfront. Several agencies offer themed walks: Byzantine Constantinople, Ottoman court life, Galata coffee houses, or the underground Basilica Cistern after-dark.',
      faqs: [
        { q: 'How long is a typical Istanbul walking tour?', a: 'Half-day Istanbul walking tours run 4 hours and cover Sultanahmet headlines. Full-day routes (7–8 hours) add Galata, the Spice Bazaar, and a Bosphorus ferry hop.' },
        { q: 'Do Istanbul walking tours include mosque entry?', a: 'Mosque entry in Istanbul is free for visitors during non-prayer hours. Tours plan around the daily prayer schedule and provide head coverings on request.' },
        { q: 'What should I wear for an Istanbul walking tour?', a: 'Mosque visits require shoulders and knees covered. Comfortable walking shoes are essential — Sultanahmet streets are cobbled and the Grand Bazaar is several km of uneven flooring.' },
        { q: 'When is the best season for an Istanbul walking tour?', a: 'April–May and September–October are ideal. Summer (July–August) is hot and humid; winter is mild but can be wet — bring a waterproof layer.' },
      ],
    },
    'multi-day': {
      tagline: '2 to 5-day Istanbul tours with Bosphorus and beyond',
      intro:
        'Multi-day Istanbul tours combine the historic peninsula with deeper neighbourhood walks and excursions to the Princes\' Islands or Bursa. A typical 3-day Istanbul itinerary covers Sultanahmet on day 1, Galata and the Bosphorus on day 2, and an island or Asian-side day on day 3. Longer 5-day stays add Edirne, the Black Sea villages, or pair Istanbul with Cappadocia by domestic flight.',
      faqs: [
        { q: 'How many days do I need for Istanbul?', a: '3 days lets you cover the Sultanahmet headlines plus Galata and the Bosphorus comfortably. 5 days lets you add the Asian side and an excursion to the Princes\' Islands or Bursa.' },
        { q: 'Should I combine Istanbul with Cappadocia?', a: 'Yes — the standard combined Turkey itinerary is 3 days Istanbul + 2–3 days Cappadocia, linked by a 1-hour domestic flight. Multi-day tours on FindToursIn often package both.' },
        { q: 'Are multi-day Istanbul tours private or group?', a: 'Both are widely available. Group tours run 6–14 travellers; private tours start at around €600 for two for a 3-day base, rising with hotel category.' },
        { q: 'When is the best time for a multi-day Istanbul tour?', a: 'April–May and September–October offer the best balance of weather, crowds, and price. November–March is cheaper and quieter; July–August is hot but vibrant.' },
      ],
    },
  },
  cappadocia: {
    'multi-day': {
      tagline: '2 to 4 days of fairy chimneys, hot-air balloons, and underground cities',
      intro:
        'Multi-day Cappadocia tours give you the morning balloon flight without rushing the rest of the region. A 2-day base covers the Göreme open-air museum, Devrent Valley, Uçhisar Castle, and a sunset walk in Love Valley. 3–4 day itineraries add the underground city of Derinkuyu, the Ihlara Valley hike, and a horseback ride through Rose Valley at dawn. Most agencies on FindToursIn coordinate the balloon booking on your behalf — important because flights cancel with high winds and require flexibility.',
      faqs: [
        { q: 'How many days do I need in Cappadocia?', a: '2–3 days is enough for the Göreme highlights, a balloon flight, and the underground cities. 4 days lets you add the Ihlara Valley hike and Soğanlı.' },
        { q: 'Are balloon flights guaranteed in multi-day tours?', a: 'No — Cappadocia balloon flights cancel for safety in 25–35% of winter mornings and 10–15% of summer mornings. Multi-day tours usually keep the next day free as a backup window.' },
        { q: 'Should I combine Cappadocia with Istanbul?', a: 'Yes — almost every Turkey itinerary pairs 2–3 days Cappadocia with 3 days Istanbul, linked by a 1-hour domestic flight. Several FindToursIn agencies package both.' },
        { q: 'When is the best time for a multi-day Cappadocia tour?', a: 'April–June and September–October offer the most reliable balloon weather. Winter (December–March) gives snow-on-fairy-chimney photos but more cancellations.' },
      ],
    },
  },
  meteora: {
    'walking-tours': {
      tagline: 'Cliff-top monasteries on foot, off the main coach route',
      intro:
        'Meteora walking tours take the back paths between monasteries instead of the road — narrow trails through the rock pillars that the monks used for centuries. A standard 4-hour walking tour visits 2–3 of the six active monasteries (Megalo Meteoro, Varlaam, Roussanou, Holy Trinity, St Stephen, St Nicholas Anapafsas) and skips the busiest car-park viewpoints. Longer routes climb to hidden lookouts that coach tours never reach. Modest dress is required at every monastery.',
      faqs: [
        { q: 'How fit do I need to be for a Meteora walking tour?', a: 'Moderate fitness — 4–6 km on uneven paths with some climbing. Several agencies offer easier coach-and-walk hybrids for travellers who prefer to skip the steepest sections.' },
        { q: 'Which Meteora monasteries are best to visit?', a: 'Megalo Meteoro is the largest and most-visited; Varlaam and Roussanou are the most photographed; Holy Trinity offers the best views. A guided walking tour usually picks 2–3 to avoid monastery fatigue.' },
        { q: 'Are Meteora walking tours possible without a guide?', a: 'Independent walking is possible but trail markings can be sparse. A guided tour adds context and timing — important because monasteries close on rotating days.' },
        { q: 'When is the best time for a Meteora walking tour?', a: 'Spring (April–May) and autumn (September–October) offer ideal weather and lighter crowds. Summer is hot and busy; winter occasionally closes paths after snowfall.' },
      ],
    },
  },
  rome: {
    'walking-tours': {
      tagline: 'Forum, Trastevere, and Vatican on foot',
      intro:
        'Rome walking tours win because the city\'s historic core is denser than any metro map suggests — the Pantheon, Trevi, Spanish Steps, and Piazza Navona sit within a 1.5 km loop, and the Forum-to-Colosseum route is shorter on foot than by bus. Standard 3-hour walking tours cover one zone (Centro Storico, Ancient Rome, or Vatican); full-day variants combine two with a lunch break. Several agencies on FindToursIn run dedicated Trastevere food walks and after-dark Rome walks that finish at a wine bar in Monti.',
      faqs: [
        { q: 'How long is a typical Rome walking tour?', a: 'Half-day Rome walking tours run 3 hours and cover one neighbourhood. Full-day tours (7–8 hours) combine two zones with a lunch break and skip-the-line entries.' },
        { q: 'Do Rome walking tours include Colosseum entry?', a: 'Most Ancient Rome walking tours include a guided Colosseum and Forum visit with timed entry. Independent walks usually exclude the Colosseum — book that separately.' },
        { q: 'When is the best time for a Rome walking tour?', a: 'Early morning (8–9am) or late afternoon (4–5pm) starts beat the summer heat. April–May and September–October offer the best walking weather year-round.' },
        { q: 'What should I wear for a Rome walking tour?', a: 'Comfortable walking shoes essential — Rome\'s historic core is cobbled and you will cover 5–8 km. Vatican visits require shoulders and knees covered.' },
      ],
    },
    'food-tours': {
      tagline: 'Trastevere, Testaccio, and Roman classics with local guides',
      intro:
        'Rome food tours head where Romans actually eat — Trastevere\'s family trattorias, Testaccio\'s offal-and-pasta lineage, and the Jewish Ghetto for fried artichokes. A standard 3–4 hour tour covers 6–10 stops including pizza al taglio, supplì, cacio e pepe, gelato made fresh, and a glass of Frascati. Several agencies offer dedicated wine tours, vegetarian variants, and pasta-making classes. Walking distance is 2–3 km on Rome\'s famous cobbles.',
      faqs: [
        { q: 'How long are Rome food tours?', a: 'Most Rome food tours run 3–4 hours with 6–10 tasting stops. Evening tours (6–10pm) typically replace dinner; lunchtime tours work as a long lunch.' },
        { q: 'Where are the best food tours in Rome?', a: 'Trastevere is the classic neighbourhood for Rome food tours. Testaccio offers a more local, working-class food scene; the Jewish Ghetto specialises in Roman-Jewish cuisine like fried artichokes.' },
        { q: 'Are Rome food tours suitable for vegetarians?', a: 'Several Rome agencies on FindToursIn run dedicated vegetarian food tours. Standard itineraries can usually adapt — flag dietary needs at booking.' },
        { q: 'How much do Rome food tours cost?', a: 'Group Rome food tours start around €70 per person; premium and private experiences with wine pairings or pasta-making run €120–200.' },
      ],
    },
    'multi-day': {
      tagline: '2 to 5-day Rome itineraries with Tivoli, Pompeii, or Vatican deep dives',
      intro:
        'Multi-day Rome tours give the city the time it needs — three days lets you separate Vatican (a full half-day on its own), Ancient Rome, and the Centro Storico without the rush. 4–5 day stays add a Tivoli day for Hadrian\'s Villa and Villa d\'Este, a Pompeii-and-Naples excursion via high-speed train, or an Ostia Antica afternoon. Most agencies on FindToursIn quote land-only multi-day tours; hotels are booked separately or bundled on request.',
      faqs: [
        { q: 'How many days do I need in Rome?', a: '3 days for the highlights (Vatican, Ancient Rome, Centro Storico), 4–5 days to add a day trip and breathe between sites.' },
        { q: 'Should I do Rome and Pompeii together?', a: 'Yes — Pompeii is a 70-minute high-speed train from Rome and works as a long day trip. Multi-day Rome tours often package a Pompeii–Naples day.' },
        { q: 'Are multi-day Rome tours private or group?', a: 'Both. Small-group multi-day Rome tours run 6–14 travellers; private 3-day land-only itineraries start around €1,000 for two.' },
        { q: 'When should I book a multi-day Rome tour?', a: 'For Easter, June, and September peak weeks, book 8–12 weeks ahead — Vatican-access slots and small-group tours sell out earliest.' },
      ],
    },
  },
};

/** Get the (curated or fallback) intent copy for a (city, intent) combo.
 *  Returns `curated: false` when no hand-written entry exists, which the
 *  shouldIndex() gate uses to suppress the page entirely. */
export function getCityIntentCopy(city: string, country: string, intent: IntentSlug): IntentCopy {
  const entry = INTENT_COPY[slugify(city)]?.[intent];
  if (entry) {
    return { ...entry, curated: true };
  }
  // Generic fallback — deliberately thin so shouldIndex catches it.
  return {
    tagline: `${city} tours filtered by interest`,
    intro: `Browse ${intent.replace(/-/g, ' ')} options in ${city}, ${country} from FindToursIn agencies.`,
    faqs: [],
    curated: false,
  };
}

// -----------------------------------------------------------------
// Day-trip copy — for /day-trips-from/[city]
// -----------------------------------------------------------------
// Targets one of the highest-value programmatic patterns in the vertical
// ("day trips from {city}" — top-3 keyword family for tour-discovery
// queries). Same gate as intent copy: only ships when curated.

export interface DayTripCopy {
  intro: string;
  /** Top destinations these day trips reach — used in the visible
   *  "where these trips go" block and in the meta description. */
  topDestinations: string[];
  faqs: { q: string; a: string }[];
  curated: boolean;
}

const DAY_TRIP_COPY: Record<string, Omit<DayTripCopy, 'curated'>> = {
  athens: {
    intro:
      'Athens is the best base in mainland Greece for day trips: from a single morning departure you can reach Cape Sounion (90 minutes south), Delphi (2.5 hours northwest), the Argolida region of Mycenae and Nafplio (90 minutes south-west), or any of the Saronic islands by ferry from Piraeus. Most day trips run 8–12 hours door-to-door, include guided entry to the main archaeological site, and finish back at central Athens hotels by early evening. The ferry-based island hops to Hydra, Aegina, and Poros are the most laid-back option; Delphi and Meteora are the long-haul highlights.',
    topDestinations: ['Delphi', 'Cape Sounion', 'Mycenae & Nafplio', 'Hydra & Aegina (Saronic Gulf)', 'Meteora (long-haul)', 'Corinth & Epidaurus'],
    faqs: [
      { q: 'What are the best day trips from Athens?', a: 'The classic Athens day trips are Delphi (oracle and museum), Cape Sounion (Temple of Poseidon at sunset), Mycenae and Nafplio (Bronze Age ruins and a Venetian harbour town), and Hydra/Aegina by Saronic ferry. Meteora is doable as a long 14-hour day but is better as an overnight.' },
      { q: 'How long is a typical Athens day trip?', a: 'Most Athens day trips run 8–12 hours door-to-door with hotel pickup. Cape Sounion is the shortest at 5 hours; Delphi and Argolida are 10 hours; Meteora as a single day runs 14+ hours.' },
      { q: 'Can I do Meteora as a day trip from Athens?', a: 'Yes — by train or coach. Single-day Meteora trips from Athens leave around 7am and return after 9pm. Most travellers prefer a 2-day overnight to avoid 8 hours of return travel in a day.' },
      { q: 'How much do day trips from Athens cost?', a: 'Group day trips from Athens start around €70 per person (Cape Sounion) and rise to €100–140 for Delphi, Argolida, or Saronic-island combinations. Private day trips for two start around €350.' },
    ],
  },
  santorini: {
    intro:
      'Day trips from Santorini are mostly water-based — a catamaran day cruise around the volcano (Nea Kameni hot springs, Thirassia for lunch, Red and White beaches), a fast-ferry hop to Ios for a half-day beach run, or the longer day-tripper to Anafi. Land excursions inside Santorini cover the wine region (Pyrgos, Megalochori, Santo Wines) and the Akrotiri archaeological site. Most catamaran day trips run 5–6 hours from Vlychada and include lunch and snorkelling.',
    topDestinations: ['Volcano + Thirassia catamaran', 'Akrotiri archaeological site', 'Santorini wine region (Pyrgos)', 'Ios island (fast ferry)', 'Anafi island'],
    faqs: [
      { q: 'What are the best day trips from Santorini?', a: 'The catamaran-around-the-caldera is the must-do day trip from Santorini, covering the volcano, hot springs, Thirassia for lunch, and Red Beach. Land-based wine tours through Pyrgos and Megalochori are the second pick.' },
      { q: 'Can I day trip to Mykonos from Santorini?', a: 'Yes by fast ferry (2.5 hours each way) — but it leaves only 4 hours on the ground. Most travellers prefer to overnight on Mykonos rather than rush a return.' },
      { q: 'How long is a Santorini catamaran day trip?', a: 'Standard catamaran day trips run 5–6 hours, including 2–3 swim stops (volcano hot springs, Red Beach, White Beach) and a Greek lunch onboard.' },
      { q: 'How much do day trips from Santorini cost?', a: 'Catamaran day trips on Santorini start around €130 per person; private boats run €1,500–3,000 per group. Wine-tour day trips are cheaper at €70–110.' },
    ],
  },
  istanbul: {
    intro:
      'Istanbul day trips reach the Princes\' Islands by ferry (90 minutes to Büyükada, no cars on the islands), Bursa by hydrofoil and bus (Ottoman first-capital with the Green Mosque and the silk bazaar), and the Black Sea villages along the Bosphorus north of the city. The most underrated option is a full-day Bosphorus cruise that drops travellers at Anadolu Kavağı for lunch and a Genoese-castle walk before the return ferry. Each day trip works year-round, though winter hydrofoils to Bursa run reduced schedules.',
    topDestinations: ['Princes\' Islands (Büyükada, Heybeliada)', 'Bursa (Ottoman first capital)', 'Bosphorus full-day cruise', 'Şile and Black Sea coast', 'Edirne (long-haul, 4hr each way)'],
    faqs: [
      { q: 'What are the best day trips from Istanbul?', a: 'Princes\' Islands by ferry is the most popular day trip from Istanbul — 90 minutes each way, no cars on the islands, classic Belle Epoque architecture. Bursa is the second pick for an Ottoman heritage day; the full-day Bosphorus cruise is the third.' },
      { q: 'Can I day trip to Cappadocia from Istanbul?', a: 'Not realistically — Cappadocia is a 1-hour flight, then 90 minutes of ground transfer. Plan at least 2 nights in Cappadocia to fit the balloon flight and the Göreme highlights.' },
      { q: 'How do I get to Princes\' Islands?', a: 'Ferries leave Kabataş (European side) and Bostancı (Asian side) every 90 minutes. Plan 90 minutes each way to Büyükada, the largest island; bring a bike or rent one onshore.' },
      { q: 'How much do day trips from Istanbul cost?', a: 'Group day trips from Istanbul start around €40 (Princes\' Islands) and rise to €90–120 for Bursa or full-day Bosphorus. Private day trips for two start at €250.' },
    ],
  },
  rome: {
    intro:
      'Rome day trips break neatly into three groups: ancient sites (Pompeii and Herculaneum reachable in 70 minutes by high-speed train), hill towns (Tivoli for Hadrian\'s Villa and Villa d\'Este, Orvieto for the Etruscan ridge town, Castel Gandolfo for the papal lake), and Tuscany sampler trips (Florence in 1.5 hours by Frecciarossa). The best one-day combination is Pompeii + Naples-pizza-lunch, finishing at Sorrento for the late-afternoon Bay-of-Naples viewpoint. Tivoli is the easiest half-day; Pompeii needs a full day.',
    topDestinations: ['Pompeii & Naples', 'Tivoli (Hadrian\'s Villa, Villa d\'Este)', 'Orvieto', 'Florence (high-speed train)', 'Castel Gandolfo & Lake Albano', 'Ostia Antica'],
    faqs: [
      { q: 'What are the best day trips from Rome?', a: 'Pompeii is the classic Rome day trip — 70 minutes each way by high-speed train and 4–5 hours on site with a guide. Tivoli (Hadrian\'s Villa + Villa d\'Este) is the easier half-day; Orvieto and Florence are the longer-distance picks.' },
      { q: 'How long is a Pompeii day trip from Rome?', a: 'A full-day Pompeii trip from Rome runs 10–12 hours door-to-door, including the high-speed train, guided ruins visit, and an optional Naples lunch.' },
      { q: 'Can I see Florence as a day trip from Rome?', a: 'Yes — the Frecciarossa runs Rome–Florence in 90 minutes each way. A full Florence day trip lasts 11–12 hours and covers the Duomo, Uffizi (book ahead), and Ponte Vecchio.' },
      { q: 'How much do day trips from Rome cost?', a: 'Group day trips from Rome start around €80 (Tivoli) and rise to €130–180 for Pompeii or Florence with skip-the-line entries. Private day trips for two start at €450.' },
    ],
  },
  cappadocia: {
    intro:
      'Cappadocia day trips fan out from Göreme: the Red Tour (north Cappadocia — Devrent Valley, Pasabag fairy chimneys, Avanos pottery) and the Green Tour (south Cappadocia — Derinkuyu underground city, Ihlara Valley hike, Selime monastery) cover the headline sites in two single-day routes. A third less-touristed option is the Blue Tour to Soğanlı Valley. Sunrise hot-air-balloon flights are a separate 90-minute experience that pairs with any day-trip route. Pick Red Tour for photography, Green Tour for hiking and the underground city.',
    topDestinations: ['Red Tour (north Cappadocia)', 'Green Tour (Derinkuyu + Ihlara Valley)', 'Blue Tour (Soğanlı Valley)', 'Hot-air balloon flight (sunrise)', 'Avanos pottery & Pigeon Valley'],
    faqs: [
      { q: 'What are the best day trips from Cappadocia?', a: 'The Red Tour (Devrent Valley + Pasabag + Avanos) and Green Tour (Derinkuyu underground city + Ihlara Valley + Selime) are the two classic Cappadocia day trips. Most travellers do one of each over two days.' },
      { q: 'Should I do the Red Tour or Green Tour first?', a: 'Red Tour first — it covers the closer, photo-friendly fairy-chimney sites and acclimatises you to Cappadocia\'s scale. Green Tour involves the underground city and a 4-km Ihlara hike, better tackled on day 2.' },
      { q: 'Can I do a Cappadocia balloon flight as a day trip?', a: 'A balloon flight is a 90-minute pre-dawn activity rather than a full day trip. Pair it with a Red Tour later the same day for an efficient 1-night Cappadocia visit.' },
      { q: 'How much do day trips from Cappadocia cost?', a: 'Group Red and Green tours from Cappadocia run €40–70 per person including lunch. Private full-day tours for two start at €180; balloon flights are separate at €180–250.' },
    ],
  },
};

export function getDayTripCopy(city: string): DayTripCopy {
  const entry = DAY_TRIP_COPY[slugify(city)];
  if (entry) return { ...entry, curated: true };
  return {
    intro: `Browse day trips departing from ${city} on FindToursIn.`,
    topDestinations: [],
    faqs: [],
    curated: false,
  };
}
