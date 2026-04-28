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
  italy: {
    name: 'Italy',
    tagline: 'Roman ruins, Tuscan hills, and Amalfi coastline',
    intro:
      'Italy offers an unmatched blend of history, food and landscape. Hike the coastal trails of Cinque Terre, tour the frozen-in-time streets of Pompeii, or unwind at Tuscan thermal baths — all with local agencies who know the terrain.',
    whenToVisit:
      'April to June and September to October are the sweet spots: warm weather, manageable crowds, and prime harvest season in wine country. July and August are hot and packed with tourists.',
    mustSee: ['Cinque Terre trail', 'Pompeii', 'Amalfi Coast', 'Tuscan vineyards', 'Colosseum', 'Venice canals'],
    heroImage: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=2000&h=900&fit=crop',
  },
  turkey: {
    name: 'Turkey',
    tagline: 'Where continents meet — ancient ruins, bazaars, and coastline',
    intro:
      'Turkey spans ancient Ephesus, Byzantine Istanbul, the hot-air balloon valleys of Cappadocia, and the turquoise Lycian coast. Our agencies specialise in archaeology tours, hammam & spa experiences, and multi-day coastal treks.',
    whenToVisit:
      'Spring (April–May) and autumn (September–October) are the best times: mild weather for hiking and outdoor sightseeing. Coastal resorts run June through September.',
    mustSee: ['Cappadocia balloons', 'Ephesus', 'Hagia Sophia', 'Lycian Way', 'Pamukkale', 'Bosphorus cruise'],
    heroImage: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=2000&h=900&fit=crop',
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
