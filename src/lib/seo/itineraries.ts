// Curated multi-day itineraries — `/itineraries/{country}/{N}-days`. These
// are the highest-converting traveller-research format ("Greece 7 day
// itinerary" is one of the highest-volume tour-related queries in the
// vertical). Each itinerary is a hand-written day-by-day plan with
// suggested tour slugs from FindToursIn — we don't auto-generate them
// because the value is editorial, not data.

export interface ItineraryDay {
  day: number;
  /** Headline for the day. */
  title: string;
  /** Where you wake up that morning. */
  base: string;
  /** Plain-English narrative for the day. */
  body: string;
  /** Optional FindToursIn tour slugs that fit this day, surfaced as
   *  internal links. Tours that no longer exist are silently skipped. */
  suggestedTourSlugs?: string[];
}

export interface Itinerary {
  /** Country slug used in the URL. */
  countrySlug: string;
  /** Country display name (matches DB casing). */
  country: string;
  /** Duration in days (used in URL + schema + count). */
  days: number;
  /** Page title (year-stamped at render time). */
  title: string;
  /** Sub-150-char meta description. */
  description: string;
  /** Tagline rendered under the H1. */
  tagline: string;
  /** ISO date last updated. */
  updated: string;
  /** 60-150-word lead passage rendered as the speakable key takeaway. */
  intro: string;
  /** Day-by-day breakdown. */
  days_plan: ItineraryDay[];
  /** Approximate land-only cost range per person, in EUR. */
  costRange: { from: number; to: number };
  /** Best months for this itinerary. */
  bestMonths: string;
  /** FAQs. */
  faqs: { q: string; a: string }[];
}

export const ITINERARIES: Itinerary[] = [

  // -------------------- GREECE 7 DAYS --------------------
  {
    countrySlug: 'greece',
    country: 'Greece',
    days: 7,
    title: 'Greece 7-Day Itinerary',
    description: 'A balanced 7-day Greece itinerary covering Athens, Delphi, Meteora, and a Cyclades island. Day-by-day with travel timings, suggested tours, and 2026 cost guidance.',
    tagline: 'Athens · Delphi · Meteora · Santorini',
    updated: '2026-05-08',
    intro: 'A 7-day Greece itinerary works best as a 3+4 split: three days mainland (Athens + Delphi + Meteora) followed by four days on a Cycladic island (Santorini, Naxos, or Mykonos). The mainland leg is logistically heavier — expect rental car or guided coach — while the island leg is built around sea, sunsets, and one or two day-trip excursions. This itinerary uses Athens and Santorini as the anchors. Swap Santorini for Naxos for a quieter alternative; for Mykonos for a more social one.',
    days_plan: [
      {
        day: 1,
        title: 'Athens — Acropolis and Plaka',
        base: 'Athens',
        body: 'Land at Athens International, transfer to a hotel in Plaka or Monastiraki (45 min by metro). Spend the afternoon on the Acropolis and ancient Agora — book a small-group walking tour with skip-the-line entry to skip 60-90 minutes of summer queueing. Dinner in Plaka or Psyrri.',
        suggestedTourSlugs: ['athens-acropolis-walking-tour'],
      },
      {
        day: 2,
        title: 'Athens — museums and food walk',
        base: 'Athens',
        body: 'Morning at the Acropolis Museum (allow 2-3 hours). Afternoon food tour through the Varvakios market and Psyrri\'s mezze bars — a 3-4 hour walk with 8 tasting stops counts as your dinner. Optional evening: Lycabettus Hill funicular for sunset over the Acropolis.',
        suggestedTourSlugs: ['athens-food-tour'],
      },
      {
        day: 3,
        title: 'Delphi day trip',
        base: 'Athens',
        body: 'Full-day guided trip to Delphi (10 hours door-to-door). The oracle site\'s setting on Mount Parnassus and the museum collection are the reason this is a non-negotiable Greece day. Return to Athens by 7-8pm; pick up an early dinner near your hotel.',
        suggestedTourSlugs: ['delphi-day-trip'],
      },
      {
        day: 4,
        title: 'Athens to Meteora and onwards',
        base: 'Meteora or Santorini',
        body: 'Choice point. Option A (recommended for first-timers): take the early train to Kalambaka, stay one night in Meteora, do a half-day monastery walking tour the next morning, then fly Athens → Santorini that evening. Option B: skip Meteora as a 2-night, instead fly direct Athens → Santorini and spend day 4 at the caldera.',
        suggestedTourSlugs: ['meteora-monasteries-day-trip'],
      },
      {
        day: 5,
        title: 'Santorini — caldera walk',
        base: 'Santorini',
        body: 'Morning: Fira to Oia caldera walk (10 km, 3-4 hours, mostly downhill from Fira). Lunch in Oia, swim at Ammoudi Bay below. Afternoon: Akrotiri archaeological site or hotel pool. Sunset cocktail in Oia (book a table at one of the caldera-edge restaurants 2 days ahead).',
        suggestedTourSlugs: ['santorini-caldera-walk'],
      },
      {
        day: 6,
        title: 'Santorini — catamaran day',
        base: 'Santorini',
        body: 'Full-day catamaran trip around the volcano: Nea Kameni hot springs, Thirassia for lunch, Red Beach and White Beach for snorkeling. 5-6 hours on the water. Evening at leisure in Megalochori or Pyrgos for a quieter dinner away from Oia\'s sunset crowds.',
      },
      {
        day: 7,
        title: 'Santorini wine tour and departure',
        base: 'Santorini',
        body: 'Morning wine tour through the inland villages of Pyrgos, Megalochori, and Santo Wines (3-4 hours). Afternoon flight back to Athens or direct international from Santorini. Buffer 3 hours for the airport in summer.',
      },
    ],
    costRange: { from: 1200, to: 2400 },
    bestMonths: 'May, June, September, early October',
    faqs: [
      { q: 'Is 7 days enough for Greece?', a: '7 days is the minimum for a satisfying Greece trip — long enough to combine 3 days mainland (Athens + Delphi + Meteora) with 3-4 days on a Cycladic island. Anything shorter forces you to pick mainland or islands, not both.' },
      { q: 'Should I rent a car for a 7-day Greece itinerary?', a: 'No — guided day trips from Athens (Delphi, Meteora) are more efficient than driving yourself, and the islands have local taxis or rentable ATVs that beat a car ferry. Save the rental for a longer mainland-circuit itinerary (10+ days).' },
      { q: 'How much does a 7-day Greece trip cost in 2026?', a: 'Land-only cost (no flights) for 7 days runs €1,200-2,400 per person depending on hotel category. Premium small-group fully-guided 7-day tours run €2,500-4,000 per person all-in.' },
      { q: 'When is the best time for a 7-day Greece trip?', a: 'May, June, September, and early October are the sweet spots — warm weather, full operator schedules, prices 20-30% below July-August peak. Avoid August unless you\'re happy with peak crowds and 38°C+ in Athens.' },
      { q: 'Can I swap Santorini for another island?', a: 'Yes — Naxos for a quieter, family-friendly alternative; Mykonos for a more social/nightlife trip; Crete for a bigger-island option (you\'d skip the catamaran day). Same 4-day island leg structure.' },
    ],
  },

  // -------------------- GREECE 10 DAYS --------------------
  {
    countrySlug: 'greece',
    country: 'Greece',
    days: 10,
    title: 'Greece 10-Day Itinerary',
    description: 'A 10-day Greece itinerary covering Athens, Delphi, Meteora, and two Cycladic islands. Day-by-day with timings, suggested tours, and 2026 cost guidance.',
    tagline: 'Athens · mainland circuit · island hop',
    updated: '2026-05-08',
    intro: 'A 10-day Greece itinerary lets you do a proper mainland circuit (Athens + Delphi + Meteora + an Argolida day) plus a 4-5 day island leg without rushing. The split below does 5 mainland and 5 islands; for travellers who want more sea time, swap one mainland day for an extra island day (drop the Argolida day-trip, keep Delphi and Meteora).',
    days_plan: [
      { day: 1, title: 'Arrival in Athens', base: 'Athens', body: 'Land, settle in Plaka. Evening orientation walk. Dinner in Psyrri.' },
      { day: 2, title: 'Acropolis and ancient Agora', base: 'Athens', body: 'Morning small-group Acropolis walk; afternoon at the Acropolis Museum. Sunset at Filopappou Hill.', suggestedTourSlugs: ['athens-acropolis-walking-tour'] },
      { day: 3, title: 'Argolida day trip', base: 'Athens', body: 'Full-day to Mycenae, Epidaurus, and Nafplio for lunch. The most well-rounded archaeology day from Athens.', suggestedTourSlugs: ['mycenae-nafplio-day-trip'] },
      { day: 4, title: 'Delphi', base: 'Athens or Delphi', body: 'Full-day guided trip to Delphi. Returns to Athens late, or stay overnight in Arachova for a quieter mountain evening.', suggestedTourSlugs: ['delphi-day-trip'] },
      { day: 5, title: 'Meteora', base: 'Meteora', body: 'Train Athens → Kalambaka, hotel check-in, sunset photography from Psaropetra viewpoint. Dinner in Kalambaka.' },
      { day: 6, title: 'Meteora monasteries and onwards', base: 'Santorini', body: 'Half-day monastery walking tour. Late train back to Athens, evening flight to Santorini.', suggestedTourSlugs: ['meteora-monasteries-day-trip'] },
      { day: 7, title: 'Santorini caldera walk', base: 'Santorini', body: 'Fira to Oia walk; lunch in Oia; afternoon at Ammoudi Bay. Sunset booked in advance.', suggestedTourSlugs: ['santorini-caldera-walk'] },
      { day: 8, title: 'Santorini catamaran day', base: 'Santorini', body: 'Catamaran around the volcano: hot springs, Thirassia lunch, Red and White beaches. Evening at leisure in Pyrgos.' },
      { day: 9, title: 'Santorini → Naxos', base: 'Naxos', body: 'Morning fast-ferry to Naxos (90 min). Afternoon at Plaka Beach; dinner in Naxos Old Town.' },
      { day: 10, title: 'Naxos and departure', base: 'Naxos', body: 'Morning at the Portara temple gate and Old Town markets. Afternoon ferry to Athens or direct flight Naxos → home.' },
    ],
    costRange: { from: 1700, to: 3400 },
    bestMonths: 'May, June, September, early October',
    faqs: [
      { q: 'Is 10 days the right length for Greece?', a: '10 days is the sweet spot for a comprehensive Greece trip — enough for a proper mainland circuit (Athens + Delphi + Meteora + Argolida) plus 4-5 days on the islands without rushing or padding.' },
      { q: 'Should I do one or two islands in 10 days?', a: 'Two islands works if they\'re close (Santorini + Naxos via 90-minute fast ferry; Santorini + Crete via 2-hour ferry). Avoid 3+ islands in 10 days — ferry transfer time becomes the trip.' },
      { q: 'How much does 10 days in Greece cost?', a: 'Land-only cost runs €1,700-3,400 per person for 10 days depending on hotel and tour category. Premium fully-guided 10-day Greece tours run €3,500-5,500 per person all-in.' },
      { q: 'Can I do this 10-day Greece itinerary in winter?', a: 'Mainland and Athens stay open year-round and offer excellent value November-March. Most island operators close from late October — Crete and Rhodes are the longest-running. For winter, replace the island leg with the Peloponnese.' },
    ],
  },

  // -------------------- TURKEY 10 DAYS --------------------
  {
    countrySlug: 'turkey',
    country: 'Turkey',
    days: 10,
    title: 'Turkey 10-Day Itinerary',
    description: 'A 10-day Turkey itinerary covering Istanbul, Cappadocia, and the Aegean coast. Day-by-day with travel timings and 2026 cost guidance.',
    tagline: 'Istanbul · Cappadocia · Ephesus and the Aegean',
    updated: '2026-05-08',
    intro: 'A 10-day Turkey itinerary works as a 3+3+4 split: three days in Istanbul, three in Cappadocia (with the balloon flight as a buffer-able morning), and four on the Aegean coast (Ephesus + Pamukkale + Bodrum or Fethiye). Domestic flights link the legs efficiently — Turkish Airlines runs frequent 1-hour hops Istanbul-Cappadocia and Cappadocia-Izmir.',
    days_plan: [
      { day: 1, title: 'Istanbul arrival', base: 'Istanbul', body: 'Land at Istanbul Airport, transfer to Sultanahmet (45 min). Evening orientation walk; dinner in Karaköy or along the waterfront.' },
      { day: 2, title: 'Sultanahmet on foot', base: 'Istanbul', body: 'Morning at Hagia Sophia and the Blue Mosque. Lunch in the Spice Bazaar. Afternoon at Topkapı Palace. Evening Bosphorus ferry to Kadıköy for dinner.', suggestedTourSlugs: ['istanbul-walking-tour'] },
      { day: 3, title: 'Istanbul food walk and Galata', base: 'Istanbul', body: 'Morning food tour through Eminönü and across to Kadıköy on the Asian side (4-5 hours). Afternoon: Galata Tower and Istiklal walk. Late flight to Cappadocia.', suggestedTourSlugs: ['istanbul-food-tour'] },
      { day: 4, title: 'Cappadocia balloon and Red Tour', base: 'Cappadocia', body: 'Pre-dawn balloon flight (90 min). Breakfast back at hotel. Red Tour through Devrent, Pasabag, Avanos pottery, Pigeon Valley. Sunset at Uçhisar Castle.' },
      { day: 5, title: 'Cappadocia Green Tour', base: 'Cappadocia', body: 'Full-day Green Tour: Derinkuyu underground city, Ihlara Valley 4-km hike with riverside lunch, Selime monastery. Long but rewarding day.' },
      { day: 6, title: 'Cappadocia to Izmir', base: 'Selçuk', body: 'Morning at leisure in Göreme (markets, Pottery Cave restaurant for lunch). Afternoon flight Cappadocia → Izmir. Drive 1 hour to Selçuk. Dinner in town.' },
      { day: 7, title: 'Ephesus', base: 'Selçuk', body: 'Half-day guided Ephesus tour with the Terrace Houses upgrade. Afternoon at the House of the Virgin Mary and the Temple of Artemis ruins. Quiet evening.', suggestedTourSlugs: ['ephesus-guided-tour'] },
      { day: 8, title: 'Pamukkale day trip', base: 'Selçuk', body: 'Long day to Pamukkale and Hierapolis (3 hours each way by car). Travertine pools, the ancient theatre, Cleopatra\'s pool. Return to Selçuk.' },
      { day: 9, title: 'Selçuk to coast', base: 'Bodrum or Fethiye', body: 'Drive to Bodrum (3 hours) for nightlife or Fethiye (4 hours) for blue-cruise sailing. Beach afternoon, harbour dinner.' },
      { day: 10, title: 'Coast and departure', base: 'Coast', body: 'Morning swim or short blue-cruise (3-4 hours). Afternoon flight to Istanbul for international connection or direct international from Bodrum/Dalaman.' },
    ],
    costRange: { from: 1500, to: 3200 },
    bestMonths: 'April, May, September, October',
    faqs: [
      { q: 'Is 10 days enough for Turkey?', a: '10 days lets you cover Istanbul (3 days), Cappadocia (3), and the Aegean coast (4) without rushing. For just Istanbul + Cappadocia, 6-7 days is the right length.' },
      { q: 'Should I fly or take buses between Turkish cities?', a: 'Fly. Turkish Airlines and Pegasus run frequent 1-hour domestic flights for €40-80 each way. Bus times are 8-12 hours for the same routes — only worth it if budget is the absolute priority.' },
      { q: 'When is the best month for a 10-day Turkey trip?', a: 'May, September, and early October are ideal — Cappadocia balloon weather is reliable, the coast is warm enough for swimming, and Istanbul isn\'t humid yet. Avoid July-August unless coast time dominates.' },
      { q: 'How much does 10 days in Turkey cost?', a: 'Land-only cost runs €1,500-3,200 per person depending on hotel category and balloon flight (€180-250 separate). Premium fully-guided 10-day Turkey tours run €3,000-5,000 per person all-in.' },
    ],
  },

  // -------------------- ITALY 7 DAYS --------------------
  {
    countrySlug: 'italy',
    country: 'Italy',
    days: 7,
    title: 'Italy 7-Day Itinerary',
    description: 'A 7-day Italy itinerary covering Rome, Florence, and the Cinque Terre or Tuscany. Day-by-day with high-speed train timings and 2026 cost guidance.',
    tagline: 'Rome · Florence · Tuscany or the coast',
    updated: '2026-05-08',
    intro: 'A 7-day Italy itinerary works best as 3+3+1: three days in Rome, three in Florence (with day trips), and one transition day onwards. The Frecciarossa high-speed train (Rome → Florence in 90 minutes) makes this efficient. For a beach-leaning alternative, swap Tuscany day-trips for two days on the Cinque Terre coast.',
    days_plan: [
      { day: 1, title: 'Rome arrival and Centro Storico', base: 'Rome', body: 'Land, settle in near Pantheon or Trastevere. Late afternoon walk: Pantheon, Trevi, Piazza Navona. Dinner in Trastevere.' },
      { day: 2, title: 'Vatican and St Peter\'s', base: 'Rome', body: 'Full half-day in the Vatican Museums and Sistine Chapel (book a small-group walk with skip-the-line). Afternoon at Castel Sant\'Angelo and a Trastevere food walk.', suggestedTourSlugs: ['rome-vatican-tour'] },
      { day: 3, title: 'Ancient Rome', base: 'Rome', body: 'Morning at the Colosseum and Forum (book a guided tour). Afternoon at Capitoline Museums. Evening: aperitivo near Campo de\' Fiori.', suggestedTourSlugs: ['rome-colosseum-tour'] },
      { day: 4, title: 'Rome to Florence', base: 'Florence', body: 'Late-morning Frecciarossa to Florence (90 min). Afternoon Duomo climb (book ahead). Sunset from Piazzale Michelangelo. Dinner in Oltrarno.' },
      { day: 5, title: 'Florence Renaissance', base: 'Florence', body: 'Morning at the Uffizi Gallery (book a 10am slot; allow 3 hours). Lunch at Mercato Centrale. Afternoon at the Accademia (David, book ahead). Evening passeggiata.' },
      { day: 6, title: 'Tuscany day trip OR Cinque Terre', base: 'Florence', body: 'Option A: Day trip to Siena, San Gimignano, and a Chianti vineyard with lunch. Option B: Day to the Cinque Terre by train (1.5 hours each way) — 3 villages, 1 hike between them. Both work; Tuscany wins for food, Cinque Terre for landscape.' },
      { day: 7, title: 'Florence and departure', base: 'Florence', body: 'Morning at the Bargello sculpture museum or the Boboli Gardens. Train to Rome airport (1.5 hours) or direct international from Florence (limited routes).' },
    ],
    costRange: { from: 1300, to: 2800 },
    bestMonths: 'April, May, June, September, October',
    faqs: [
      { q: 'Is 7 days enough for Italy?', a: '7 days is enough for Rome + Florence + one day trip; not enough for Rome + Venice + the Amalfi Coast. Pick a region; don\'t try to cover the whole country in a week.' },
      { q: 'Should I fly or take the train between Rome and Florence?', a: 'Train. The Frecciarossa runs Rome → Florence in 90 minutes city-centre to city-centre — faster than flying once airport time is included.' },
      { q: 'How much does 7 days in Italy cost?', a: 'Land-only cost runs €1,300-2,800 per person depending on hotel and tour category. Premium small-group fully-guided 7-day Italy tours run €2,800-4,500 per person all-in.' },
      { q: 'Should I add Venice to a 7-day Italy itinerary?', a: 'No — Venice deserves 2-3 dedicated days and the train from Florence is 2 hours each way. Save Venice for a longer 10-12 day Italy itinerary that drops one Florence day.' },
      { q: 'Is the Amalfi Coast doable in 7 days with Rome and Florence?', a: 'Tight. The Amalfi Coast is 4 hours south of Rome by train+bus; you\'d need to drop Florence to fit it. A better 7-day Italy split for Amalfi-leaning travellers: Rome (3) + Sorrento/Amalfi (4).' },
    ],
  },
];

export function getItinerary(countrySlug: string, days: number): Itinerary | undefined {
  return ITINERARIES.find((i) => i.countrySlug === countrySlug && i.days === days);
}
