// Neighborhood data for /tours/in/[country]/[city]/neighborhood/[slug].
// Captures the "tours in [neighborhood]" long-tail — high-intent queries
// from travellers who already know the city and want a more specific filter.
//
// Same gating model as attractions: each neighborhood is hand-curated;
// pages 404 unless the city + slug match a curated entry. We don't ship
// neighborhood pages for cities where the tour count doesn't justify the
// editorial effort.

export interface Neighborhood {
  slug: string;
  name: string;
  city: string;
  country: string;
  /** 60-180 word lead passage — speakable. */
  description: string;
  /** Why a tour here vs another part of the city. */
  tourFocus: string;
  /** Best for what kind of visit. */
  bestFor: string[];
  /** Approximate walking distance for a typical neighborhood tour. */
  walkingDistance?: string;
  /** Hero image URL. */
  heroImage: string;
  /** ISO date last reviewed. */
  updated: string;
  /** Tour-name keywords used to pull matching tours from the DB.
   *  Conservative — better to surface no tours than the wrong ones. */
  tourKeywords: string[];
  /** 4 FAQs that close the page. */
  faqs: { q: string; a: string }[];
}

export const NEIGHBORHOODS: Neighborhood[] = [

  // -------- ATHENS --------
  {
    slug: 'plaka',
    name: 'Plaka',
    city: 'Athens',
    country: 'Greece',
    description: 'Plaka is the oldest residential neighbourhood in Athens, sitting at the foot of the Acropolis. The narrow car-free lanes are a maze of 19th-century houses, neoclassical mansions, and small Byzantine churches, with rooftop tavernas catching the Acropolis floodlights at night. The neighbourhood is dense — most travellers walk it in a single afternoon, but layered visits reward the second look. Anafiotika, the Cycladic-style cliff village hidden inside Plaka, is one of the most-photographed corners of central Athens.',
    tourFocus: 'Plaka tours pair the historic core with a food-and-wine angle — the same streets that hosted ancient Athenians now host the city\'s most-walked taverna circuit.',
    bestFor: ['Walking tours', 'Food tours', 'Photography', 'Evening tavernas'],
    walkingDistance: '2–3 km on car-free cobbled streets',
    heroImage: 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['plaka', 'acropolis', 'athens'],
    faqs: [
      { q: 'How do you get to Plaka in Athens?', a: 'Plaka is the historic neighbourhood directly below the Acropolis. The closest metro stations are Acropoli (line 2) and Monastiraki (lines 1 and 3). The neighbourhood is a 5–10 minute walk from either station.' },
      { q: 'What is Plaka famous for?', a: 'Plaka is famous for being Athens\' oldest neighbourhood — the only part of the modern city continuously inhabited since antiquity. It is known for car-free cobbled streets, neoclassical houses, rooftop tavernas with Acropolis views, and the cliff village of Anafiotika.' },
      { q: 'Is Plaka worth visiting?', a: 'Yes — Plaka is the most atmospheric district in central Athens and an essential stop on any first visit. Plan 2–3 hours minimum; longer if you include a meal at a rooftop taverna.' },
      { q: 'When is the best time to visit Plaka?', a: 'Late afternoon into evening for the rooftop-taverna scene with the Acropolis lit up. Mornings work well for the food-market route through Varvakios. Avoid the 1pm–4pm midday block in summer when the cobbled streets reflect the heat.' },
    ],
  },

  // -------- ROME --------
  {
    slug: 'trastevere',
    name: 'Trastevere',
    city: 'Rome',
    country: 'Italy',
    description: 'Trastevere is the medieval neighbourhood across the Tiber from Rome\'s historic centre, traditionally a working-class district of artisan workshops and family trattorias. The narrow lanes of cobblestone streets, ivy-covered buildings, and the 12th-century basilica of Santa Maria in Trastevere make it one of the most photogenic parts of Rome. Trastevere is the densest food neighbourhood in the city — most Roman food tours start or end here. The area transforms after dark from sleepy quarter to packed eating-and-drinking destination.',
    tourFocus: 'Trastevere tours center on food walks (pizza al taglio, supplì, cacio e pepe), evening pub-crawls, and a slower architectural walk through the basilica and Santa Cecilia\'s frescoes.',
    bestFor: ['Food tours', 'Evening walks', 'Local trattorias', 'Photography'],
    walkingDistance: '2–3 km on cobbled streets',
    heroImage: 'https://images.unsplash.com/photo-1622891234322-9b2bd5d4cdc4?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['trastevere', 'rome', 'food', 'pasta'],
    faqs: [
      { q: 'What is Trastevere known for?', a: 'Trastevere is Rome\'s medieval working-class neighbourhood across the Tiber, known for cobblestone streets, family-run trattorias, the 12th-century Santa Maria in Trastevere basilica, and being the densest food district in the city.' },
      { q: 'Is Trastevere safe at night?', a: 'Yes — Trastevere is one of Rome\'s most-visited evening neighbourhoods and is generally safe. Standard urban precautions apply: keep an eye on bags in crowded bar areas and use registered taxis after midnight.' },
      { q: 'Are food tours in Trastevere worth it?', a: 'Yes — Trastevere\'s family trattorias and pizza al taglio bakeries are the sweet spot of Roman food. A 3-4 hour guided food walk with 8 tasting stops counts as your dinner and introduces shopkeepers personally.' },
      { q: 'How do you get to Trastevere?', a: 'Trastevere has no metro stop. The closest options are Tram 8 from Largo Argentina (5 min) or a 15-minute walk from Largo Argentina or Vatican area. Most Rome food tours include the walk from the meeting point.' },
    ],
  },

  // -------- ISTANBUL --------
  {
    slug: 'sultanahmet',
    name: 'Sultanahmet',
    city: 'Istanbul',
    country: 'Turkey',
    description: 'Sultanahmet is the historic peninsula of Istanbul, packing the city\'s two most iconic monuments — Hagia Sophia and the Blue Mosque — within 200 metres of each other. The Topkapı Palace, the Basilica Cistern, the Hippodrome, and the German Fountain complete a single-square-kilometre concentration of 1,500 years of imperial history. The neighbourhood is mostly tourism-oriented; locals work here but rarely live here. Most first-time visitors base in Sultanahmet for proximity, then explore Galata or Karaköy in the evenings for a more local rhythm.',
    tourFocus: 'Sultanahmet walking tours hit Hagia Sophia, the Blue Mosque, the Hippodrome, Topkapı, and the Basilica Cistern in 4-5 hours. Skip-the-line entry to the upper gallery of Hagia Sophia is the differentiator.',
    bestFor: ['Walking tours', 'Historical tours', 'Mosque visits', 'First-time visits'],
    walkingDistance: '2–4 km on cobbled streets and through palaces',
    heroImage: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['sultanahmet', 'istanbul', 'hagia sophia', 'blue mosque'],
    faqs: [
      { q: 'What can you see in Sultanahmet?', a: 'Sultanahmet packs Hagia Sophia, the Blue Mosque, Topkapı Palace, the Basilica Cistern, the Hippodrome, and the German Fountain into a single square kilometre. It is the most-visited part of Istanbul and the historical core of the city.' },
      { q: 'How long do you need in Sultanahmet?', a: 'A half-day (4-5 hours) covers the main monuments; a full day is needed if you want to enter Topkapı Palace and the Hagia Sophia upper gallery. Plan two visits — one daytime walk, one evening for the lit minarets.' },
      { q: 'Is Sultanahmet safe?', a: 'Yes — Sultanahmet is one of Istanbul\'s most-policed neighbourhoods and is safe for tourists day and night. Be alert for pickpockets in crowded areas and avoid unsolicited "free guide" offers near major monuments.' },
      { q: 'Should you stay in Sultanahmet?', a: 'For first-time visitors yes — proximity to the major monuments saves time. For a more local feel, base in Galata or Karaköy and visit Sultanahmet daily; it is a 15-minute tram ride from either.' },
    ],
  },
  {
    slug: 'galata',
    name: 'Galata',
    city: 'Istanbul',
    country: 'Turkey',
    description: 'Galata is the historic Genoese quarter on the European side of Istanbul, climbing uphill from the Karakoy waterfront to the 14th-century Galata Tower at its summit. The streets retain a 19th-century European character: stone-paved lanes, art-nouveau apartment blocks, and the highest concentration of speciality coffee bars in the city. The Tunel funicular (the world\'s second-oldest underground railway, 1875) connects Galata to Istiklal Street and the Beyoglu nightlife district. Galata is the standard alternative to Sultanahmet for travellers who want a more local urban rhythm.',
    tourFocus: 'Galata tours pair the tower-and-views walk with cafe-and-craft-shop browsing along Camekan Street and the surrounding lanes. Evening tours add the Beyoglu meyhane (taverna) circuit on Istiklal.',
    bestFor: ['Walking tours', 'Coffee culture', 'Cafe walks', 'Sunset views'],
    walkingDistance: '2 km uphill plus the Galata Tower climb',
    heroImage: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['galata', 'istanbul', 'beyoglu', 'tower'],
    faqs: [
      { q: 'How do you get to Galata?', a: 'Galata is accessible from Sultanahmet via the modern T1 tram to Karakoy, then a 5-minute uphill walk or the historic Tunel funicular. From the Asian side, ferries from Kadikoy land at Karakoy directly.' },
      { q: 'Is the Galata Tower worth visiting?', a: 'Yes for the panoramic 360-degree view of Istanbul, including the Bosphorus, Sultanahmet, and the Asian shore. The €30 entry fee is on the high side for the tower itself; the view is the only justification.' },
      { q: 'What is Galata known for?', a: 'Galata is known for the Galata Tower, the historic Genoese district, and the highest concentration of speciality coffee, art galleries, and design shops in Istanbul. The neighbourhood is a creative-class residential and dining zone.' },
      { q: 'When is the best time to visit Galata?', a: 'Late afternoon into evening for the tower at sunset and the cafe scene at peak. Mornings work for quiet exploration of the back lanes. Avoid weekend afternoons when Istiklal Street nearby gets very crowded.' },
    ],
  },
  {
    slug: 'karakoy',
    name: 'Karakoy',
    city: 'Istanbul',
    country: 'Turkey',
    description: 'Karakoy is the working waterfront neighbourhood at the foot of Galata, transformed in the past decade from a wholesale district into one of Istanbul\'s most active food, design, and gallery zones. The Karakoy fish market is a single block from the ferry pier; rooftop cocktail bars look out over the Golden Horn to the Sultanahmet skyline. The Galataport development on the cruise-ship terminal added a museum strip (Istanbul Modern, the Salt Galata research library), making the area a full half-day of cultural walking.',
    tourFocus: 'Karakoy tours pair the fish-market food walk with the Galata cafe ascent and the Istanbul Modern art museum. Evening rooftop bar circuits are the standard finish.',
    bestFor: ['Food tours', 'Galleries', 'Rooftop bars', 'Ferry hops'],
    walkingDistance: '2 km along the waterfront with optional Galata uphill',
    heroImage: 'https://images.unsplash.com/photo-1639420692842-ba9a89bbf4d6?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['karakoy', 'istanbul', 'galataport', 'istanbul modern'],
    faqs: [
      { q: 'Where is Karakoy in Istanbul?', a: 'Karakoy is the European-side waterfront neighbourhood between the Galata Bridge and the new Galataport cruise terminal. It is connected to Sultanahmet by the T1 tram and to the Asian side by frequent ferries.' },
      { q: 'What can you do in Karakoy?', a: 'Karakoy combines the historic fish market, the Galata Bridge fishermen, the Istanbul Modern art museum, the Salt Galata gallery, and a dense rooftop bar scene. A half-day covers the main spots.' },
      { q: 'Is Karakoy worth visiting?', a: 'Yes — Karakoy is the most-changed neighbourhood in Istanbul over the last decade and now offers the best contemporary art surface in the city, plus an excellent food and rooftop bar scene.' },
      { q: 'How do you combine Karakoy with other neighbourhoods?', a: 'Most travellers walk Karakoy and Galata together as a single afternoon: ferry in from Kadikoy or tram from Sultanahmet, fish-market lunch, climb to Galata Tower, sunset cocktail at a Karakoy rooftop, then tram back.' },
    ],
  },

  // -------- ATHENS (additional) --------
  {
    slug: 'monastiraki',
    name: 'Monastiraki',
    city: 'Athens',
    country: 'Greece',
    description: 'Monastiraki is the bazaar-and-square neighbourhood at the meeting point of Plaka, Psyrri, and the ancient Agora, named for the small 10th-century Byzantine monastery in the central square. The flea market and Sunday morning antiques bazaar are the historic anchors; Avissinias Square has been a furniture-and-curio market for over a century. Monastiraki is the natural transit hub between the Acropolis, Plaka, and Psyrri\'s nightlife district, with the busiest metro interchange in Athens beneath the square.',
    tourFocus: 'Monastiraki tours pair the flea market walk with rooftop cafe stops looking at the Acropolis, plus shortcut access to Psyrri\'s mezze bars in the evening.',
    bestFor: ['Flea market', 'Rooftop cafes', 'Acropolis views', 'Evening walks'],
    walkingDistance: '1–2 km on flat pedestrian streets',
    heroImage: 'https://images.unsplash.com/photo-1597409046773-6cef4ac4c001?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['monastiraki', 'athens', 'flea market'],
    faqs: [
      { q: 'What can you do in Monastiraki?', a: 'Monastiraki combines the flea market, the Sunday antiques bazaar at Avissinias Square, rooftop cafes with Acropolis views, and direct access to the ancient Agora and Hadrian\'s Library. A half-day fits all the main stops.' },
      { q: 'When is the Monastiraki flea market?', a: 'The flea market runs daily, but Sunday morning is the largest day with the antiques traders fully set up at Avissinias Square. Arrive between 9am and noon for the best variety.' },
      { q: 'How do you get to Monastiraki?', a: 'Monastiraki has its own metro station on lines 1 and 3 (the busiest interchange in Athens). It\'s a 5-minute walk from Plaka and a 10-minute walk from the Acropolis main entrance.' },
      { q: 'Is Monastiraki worth visiting?', a: 'Yes — Monastiraki is the natural pivot between the Acropolis, Plaka, and Psyrri. Most Athens walking tours pass through; it\'s also the best place in central Athens for low-budget rooftop bars facing the Acropolis.' },
    ],
  },
  {
    slug: 'anafiotika',
    name: 'Anafiotika',
    city: 'Athens',
    country: 'Greece',
    description: 'Anafiotika is the cliff-side village hidden inside the northern slope of the Acropolis, one of the most-photographed corners of central Athens. Built in the 1840s by stonemasons brought to Athens from the Cycladic island of Anafi, the whitewashed houses and bougainvillea-draped lanes look like a transplanted island village in the middle of the city. The neighbourhood is residential and quiet — visitors walk through, locals live there. Connect Anafiotika with Plaka below and the Acropolis above for a single 90-minute walk.',
    tourFocus: 'Most Acropolis-and-Plaka walking tours pass through Anafiotika as a slow-paced photo stop. The neighbourhood is too small to merit a dedicated tour; it works as a 30-minute segment of a larger Athens walk.',
    bestFor: ['Photography', 'Quiet walks', 'Cycladic-style architecture', 'Acropolis approaches'],
    walkingDistance: '500 m on steep cobbled and stepped paths',
    heroImage: 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['anafiotika', 'athens', 'plaka', 'acropolis'],
    faqs: [
      { q: 'Where is Anafiotika?', a: 'Anafiotika is on the northern slope of the Acropolis, accessed from Plaka via the small stepped lanes off Theorias Street. Most travellers find it by walking uphill from Lysikratous Square in Plaka.' },
      { q: 'Is Anafiotika a real neighbourhood?', a: 'Yes — Anafiotika is a residential neighbourhood with about 45 inhabited houses, founded in the 1840s by Cycladic stonemasons. Visitors walk through but should keep noise low and respect the living-neighbourhood character.' },
      { q: 'How long does it take to walk Anafiotika?', a: '20–30 minutes for the full loop of stepped lanes. Most travellers visit Anafiotika as a segment of a larger Plaka and Acropolis walk rather than a dedicated stop.' },
      { q: 'When is the best time for Anafiotika?', a: 'Late afternoon for golden-hour photography. Early morning is the quietest time with the cleanest light. Avoid the 11am–3pm midday block when sun glare is harsh on the white walls.' },
    ],
  },

  // -------- ROME (additional) --------
  {
    slug: 'monti',
    name: 'Monti',
    city: 'Rome',
    country: 'Italy',
    description: 'Monti is the bohemian neighbourhood between the Roman Forum and Termini station, historically the working-class Subura district where Julius Caesar grew up. Today it is one of Rome\'s most-walked alternative-to-Trastevere zones — narrow lanes, vintage stores on Via del Boschetto, an early-evening passeggiata around Piazza della Madonna dei Monti, and a dense small-restaurant scene that hits at fair Roman prices. The neighbourhood works as a 90-minute evening walk after a Colosseum daytime visit.',
    tourFocus: 'Monti tours pair the post-Colosseum aperitivo walk with vintage-shop browsing and the small-trattoria dinner circuit. Evening walking tours from major Roman hotels typically include Monti as the after-dinner stretch.',
    bestFor: ['Aperitivo walks', 'Vintage shopping', 'Evening dinner walks', 'Local Roman feel'],
    walkingDistance: '1–2 km on flat cobbled streets',
    heroImage: 'https://images.unsplash.com/photo-1602345655474-9e8e8e8e8e8e?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['monti', 'rome', 'aperitivo'],
    faqs: [
      { q: 'Where is Monti in Rome?', a: 'Monti is the neighbourhood between the Colosseum (south), Termini station (north), and Via Cavour (west). The Cavour metro station on Line B is the easiest entry point.' },
      { q: 'What is Monti known for?', a: 'Monti is known for the bohemian-chic dinner-and-aperitivo scene, vintage clothing on Via del Boschetto, and small-restaurant dining at fairer Roman prices than Trastevere or the Pantheon area.' },
      { q: 'Is Monti worth visiting?', a: 'Yes for travellers who want a more lived-in Roman neighbourhood feel. Most Trastevere alternatives recommend Monti, especially for travellers staying near Termini who want a 5-minute walk to dinner.' },
      { q: 'When does Monti come alive?', a: 'Late afternoon (5pm onwards) is when the aperitivo crowd fills Piazza della Madonna dei Monti. Dinner peaks 8–10pm. The neighbourhood is quiet during midday — most shops close 1–4pm.' },
    ],
  },
  {
    slug: 'testaccio',
    name: 'Testaccio',
    city: 'Rome',
    country: 'Italy',
    description: 'Testaccio is the old slaughterhouse neighbourhood south of the Aventine Hill, the historic heart of working-class Roman cuisine and the source of dishes like coda alla vaccinara (oxtail stew) and pajata (intestine pasta). The Testaccio Market is the most-cited Roman market for food walks, with traders specialising in cheese, charcuterie, and the offal cuts that define Roman cooking. The area is residential, working-class, and untouristed compared to Trastevere — exactly the appeal for travellers who want food-led Rome without the Insta-tourist crowd.',
    tourFocus: 'Testaccio food tours focus on the market plus a sequence of family trattorias along Via Galvani and Via Marmorata. The Testaccio circuit is the standard advanced-food-tour alternative to Trastevere.',
    bestFor: ['Food tours', 'Working-class Roman cuisine', 'Markets', 'Pizza al taglio'],
    walkingDistance: '2 km on flat streets',
    heroImage: 'https://images.unsplash.com/photo-1551883040-355cda3e60d3?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['testaccio', 'rome', 'food', 'market', 'offal'],
    faqs: [
      { q: 'Where is Testaccio?', a: 'Testaccio is the neighbourhood south of the Aventine Hill, accessible from the Pyramide metro station on Line B. It\'s a 15-minute walk from the Circus Maximus and a 25-minute walk from the Trastevere bridges.' },
      { q: 'What is Testaccio known for?', a: 'Testaccio is the working-class food neighbourhood of Rome, home to the iconic Testaccio Market and the trattorias that defined dishes like coda alla vaccinara, rigatoni alla pajata, and bucatini all\'amatriciana.' },
      { q: 'Is Testaccio better than Trastevere for food?', a: 'For traditional Roman dishes specifically, yes. Testaccio is less touristy, more authentic, and cheaper than Trastevere. Trastevere is more atmospheric for general dining; Testaccio wins for food specialists.' },
      { q: 'When is the Testaccio Market open?', a: 'The Testaccio Market is open Monday to Saturday 7am to 3:30pm. Closed Sundays. The food-stall section is busiest 11am–1pm; arrive in that window for the most active trader scene.' },
    ],
  },

  // -------- FLORENCE --------
  {
    slug: 'oltrarno',
    name: 'Oltrarno',
    city: 'Florence',
    country: 'Italy',
    description: 'Oltrarno is the "other side of the Arno" in Florence, the south-bank neighbourhood across the Ponte Vecchio that retains the working-artisan character the historic centre has lost. The Santo Spirito and San Frediano sub-neighbourhoods house gold-leaf workshops, restoration ateliers, and small leather studios — many descendants of the Renaissance guild traditions. The Boboli Gardens and Pitti Palace anchor the upper end; Piazzale Michelangelo offers the postcard sunset view of the Duomo across the river.',
    tourFocus: 'Oltrarno tours pair the artisan-workshop circuit with a Pitti Palace cultural visit, plus the Piazzale Michelangelo sunset climb. Florence food tours often base in Oltrarno because the trattoria density is higher than the centre.',
    bestFor: ['Artisan workshops', 'Sunset views', 'Pitti Palace', 'Food tours'],
    walkingDistance: '2–3 km plus 100 m climb to Piazzale Michelangelo',
    heroImage: 'https://images.unsplash.com/photo-1543429-b7d6e88ae1c9?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['oltrarno', 'florence', 'santo spirito', 'pitti'],
    faqs: [
      { q: 'Where is Oltrarno in Florence?', a: 'Oltrarno is south of the Arno, accessed via the Ponte Vecchio or Ponte alle Grazie from the historic centre. The neighbourhood includes the Santo Spirito, San Frediano, and Pitti Palace sub-zones.' },
      { q: 'What is Oltrarno known for?', a: 'Oltrarno is the working-artisan and trattoria neighbourhood of Florence, with surviving gold-leaf workshops, leather studios, and restoration ateliers. It is the standard alternative to the over-touristy historic centre.' },
      { q: 'Is the Pitti Palace worth visiting?', a: 'Yes for cultural travellers — the Pitti holds the Palatine Gallery (Raphael, Titian) and the Boboli Gardens behind. A combined ticket with the Uffizi runs €38 and is valid 5 days, the best Florence cultural-pass deal.' },
      { q: 'How do I get to Piazzale Michelangelo?', a: 'Walk uphill from Oltrarno (15-minute climb) or take bus 13 from Santa Maria Novella station. The viewpoint is free and best at sunset; arrive 30 minutes early in summer for a good edge spot.' },
    ],
  },

  // -------- VENICE (city without main pages but good neighbourhood content) --------
  {
    slug: 'cannaregio',
    name: 'Cannaregio',
    city: 'Venice',
    country: 'Italy',
    description: 'Cannaregio is the northern Venetian sestiere (district), the original Jewish Ghetto and the most lived-in part of central Venice. The Fondamenta della Misericordia evening cicchetti circuit is one of Italy\'s great bar-food experiences; the Madonna dell\'Orto church holds Tintoretto\'s family tomb and several of his masterpieces in their original setting. Cannaregio works as the alternative to over-touristed San Marco — same medieval-Venetian fabric, half the crowd.',
    tourFocus: 'Cannaregio tours combine the Jewish Ghetto historical walk with the cicchetti bar circuit. Evening tours in the bar zone are the most popular format.',
    bestFor: ['Cicchetti bars', 'Jewish Ghetto', 'Tintoretto', 'Local Venice feel'],
    walkingDistance: '2–3 km along canals',
    heroImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    tourKeywords: ['cannaregio', 'venice', 'cicchetti', 'jewish ghetto'],
    faqs: [
      { q: 'What is Cannaregio known for?', a: 'Cannaregio is the northern Venetian sestiere, home to the original Jewish Ghetto (founded 1516, the oldest in Europe), the Tintoretto family church Madonna dell\'Orto, and the cicchetti bar circuit along Fondamenta della Misericordia.' },
      { q: 'Where is the Jewish Ghetto in Venice?', a: 'The Ghetto is in central Cannaregio, accessible from Santa Lucia train station via a 15-minute walk. The Jewish Museum and three of the five historic synagogues offer guided tours; book 24 hours ahead in summer.' },
      { q: 'Are cicchetti bars worth visiting?', a: 'Yes — cicchetti bars are the classic Venetian small-plate-and-wine format and Cannaregio has the highest density of authentic ones. Plan a 2-hour evening crawl visiting 4–5 bars; €30–50 per person covers a full meal.' },
      { q: 'Is Cannaregio safe?', a: 'Yes — Cannaregio is one of the most-residential and lowest-crime parts of Venice. Standard urban precautions apply; the cicchetti zone is well-lit and busy until midnight.' },
    ],
  },
];

// Slug-friendly normaliser — same logic as in attractions.ts. Multi-word
// city names (e.g. "La Spezia") arrive as `la-spezia` from the URL, so
// we compare both sides in slug form.
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getNeighborhood(country: string, city: string, slug: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((n) =>
    n.slug === slug &&
    norm(n.country) === norm(country) &&
    norm(n.city) === norm(city),
  );
}

export function getNeighborhoodsForCity(city: string): Neighborhood[] {
  return NEIGHBORHOODS.filter((n) => norm(n.city) === norm(city));
}
