// Tour-attraction (POI) data. Powers /attractions/[country]/[city]/[slug]
// pages — one of the highest-volume keyword families in the vertical
// ("Acropolis tickets", "Hagia Sophia skip the line", "Pamukkale tour").
//
// Each attraction is hand-curated. We do NOT auto-generate these from the
// tours table because the page's value is editorial: opening hours,
// official ticket prices, queueing reality, the "skip the line" trick —
// none of which can be inferred from tour data alone.
//
// Pages are gated to ≥1 tour visiting the attraction OR the editorial
// description being long enough to stand on its own as an info page.
// (See /attractions/[country]/[city]/[slug].astro for the gate.)

export interface Attraction {
  /** URL slug used in the route. */
  slug: string;
  /** Display name. */
  name: string;
  /** City name (matches DB casing) — used to find tours that visit. */
  city: string;
  /** Country name (matches DB casing). */
  country: string;
  /** 60-180-word editorial description — the speakable lead passage. */
  description: string;
  /** What category of place is this? Maps to TouristAttraction subtypes. */
  category: 'archaeological' | 'religious' | 'palace' | 'museum' | 'natural' | 'urban' | 'beach';
  /** Official site URL (where to buy tickets), if applicable. */
  officialUrl?: string;
  /** Approximate ticket price in EUR (string for ranges like "€5–20"). */
  ticketPrice?: string;
  /** Typical visit duration. */
  visitDuration?: string;
  /** Best time of day to visit. */
  bestTime?: string;
  /** UNESCO World Heritage Site status. */
  isUnesco?: boolean;
  /** Skip-the-line tip — short paragraph specific to peak-season queueing. */
  skipTheLineTip?: string;
  /** Latitude / longitude for Place schema. */
  geo?: { lat: number; lng: number };
  /** 4-6 FAQs that close the page. */
  faqs: { q: string; a: string }[];
  /** Hero image URL — Unsplash or Supabase. */
  heroImage: string;
  /** ISO date last reviewed. */
  updated: string;
}

export const ATTRACTIONS: Attraction[] = [

  // -------- GREECE --------
  {
    slug: 'acropolis-of-athens',
    name: 'Acropolis of Athens',
    city: 'Athens',
    country: 'Greece',
    category: 'archaeological',
    isUnesco: true,
    officialUrl: 'https://odysseus.culture.gr',
    ticketPrice: '€20 (€10 reduced)',
    visitDuration: '2–3 hours',
    bestTime: 'Open 8am — arrive at 8am or after 5pm in summer to avoid heat and crowds',
    geo: { lat: 37.9715, lng: 23.7257 },
    heroImage: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'The Acropolis is the rocky citadel overlooking Athens, crowned by the 5th-century BC Parthenon. The site contains four major monuments: the Parthenon, the Erechtheion, the Temple of Athena Nike, and the monumental Propylaea entrance. A combined ticket includes the slope, the ancient Agora, and the new Acropolis Museum at the foot of the hill — together they cover roughly 2,500 years of Athenian history. Visit early morning or late afternoon in summer; midday on the rock in July reaches 38°C with no shade.',
    skipTheLineTip: 'Pre-book a timed entry through the official odysseus.culture.gr site or via a guided tour that includes skip-the-line entry. In peak summer the ticket queue at 10am can run 60–90 minutes; pre-booked entries skip it entirely.',
    faqs: [
      { q: 'How much does the Acropolis cost to visit?', a: 'The Acropolis ticket is €20 (€10 reduced) and is valid for the slope, the Parthenon, and the surrounding archaeological sites. A combined €30 ticket adds the ancient Agora, Roman Agora, Hadrian\'s Library, and Kerameikos.' },
      { q: 'When is the best time to visit the Acropolis?', a: 'Early morning at the 8am opening or late afternoon after 5pm in summer. Midday on the marble rock in July–August is brutal — 38°C with no shade and the largest crowds.' },
      { q: 'Is a guided tour of the Acropolis worth it?', a: 'For first-time visitors yes — the site has minimal signage and the architectural and mythological context dramatically lifts the experience. A 3-hour small-group tour also pre-books skip-the-line entry, saving 60–90 minutes in summer.' },
      { q: 'How long does it take to see the Acropolis?', a: 'Plan 2–3 hours for the rock alone; add another 90 minutes for the Acropolis Museum at the bottom (highly recommended). A full Acropolis-and-museum visit is a half-day commitment.' },
      { q: 'Is the Acropolis wheelchair accessible?', a: 'Partially. A wheelchair lift on the north side reaches the summit; the surface on top is uneven marble but navigable. The south slope (Theatre of Dionysus) is fully step-free.' },
    ],
  },
  {
    slug: 'meteora-monasteries',
    name: 'Meteora Monasteries',
    city: 'Meteora',
    country: 'Greece',
    category: 'religious',
    isUnesco: true,
    ticketPrice: '€3 per monastery',
    visitDuration: 'Half-day for 2–3 monasteries; full day for all six',
    bestTime: 'Spring (April–May) and autumn (September–October); avoid Mondays-Tuesdays when several rotate closed',
    geo: { lat: 39.7217, lng: 21.6306 },
    heroImage: 'https://images.unsplash.com/photo-1591622180470-32eafd91d6f0?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Meteora is a cluster of six active monasteries built atop sheer rock pillars in central Greece, accessible by stone steps cut into the cliffs. The complex was founded in the 14th century and is one of Greece\'s most photographed UNESCO sites. Each monastery rotates its closed day, so a full circuit requires 2 days; most travellers visit 2–3 in a half-day. Modest dress is required: knee-length skirts (provided at entry for women) and covered shoulders. The path between monasteries is walkable for moderate fitness, but most travellers prefer a guided coach-and-walk hybrid.',
    skipTheLineTip: 'Meteora rarely has long queues, but the parking lots fill from 10am. Arrive at 8:30am opening or join a tour that uses the back access roads. Guided tours also coordinate the rotating closure schedule so you don\'t arrive at a closed monastery.',
    faqs: [
      { q: 'How much does it cost to visit Meteora?', a: 'Each of the six Meteora monasteries charges €3 entry. Visiting all six over two days costs €18. Most guided tours include the entry fees in the package price.' },
      { q: 'Which Meteora monasteries should I visit?', a: 'For a half-day, pick Megalo Meteoro (largest, most-visited), Varlaam (most photographed exterior), and Roussanou (tallest views). For a full day, add Holy Trinity (best vista) and St Stephen (easiest access).' },
      { q: 'Can you do Meteora as a day trip from Athens?', a: 'Yes by train or coach. Single-day Meteora trips from Athens leave around 7am and return after 9pm — long but workable. Most travellers prefer a 2-day overnight to avoid 8 hours of return travel in a single day.' },
      { q: 'When is Meteora open?', a: 'Each monastery has its own schedule. April–October hours run roughly 9am–5pm; winter hours are shorter. Each monastery is closed one day per week on a rotating schedule, so check ahead or book a guided tour.' },
      { q: 'What should I wear to visit the Meteora monasteries?', a: 'Modest dress is required. Women need knee-length skirts (wraps are provided at entry) and covered shoulders. Men need long trousers. Comfortable walking shoes are essential — the paths between monasteries are uneven and steep.' },
    ],
  },
  {
    slug: 'delphi-archaeological-site',
    name: 'Delphi Archaeological Site',
    city: 'Delphi',
    country: 'Greece',
    category: 'archaeological',
    isUnesco: true,
    ticketPrice: '€12 (combined site + museum)',
    visitDuration: '2–3 hours including museum',
    bestTime: 'Morning April–October; arrive at 8am for cool light and small crowds',
    geo: { lat: 38.4824, lng: 22.5010 },
    heroImage: 'https://images.unsplash.com/photo-1608035632086-12c08bcaeae4?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Delphi was the most important oracle of the ancient Greek world, perched on the slopes of Mount Parnassus 2.5 hours north-west of Athens. The archaeological site contains the Temple of Apollo, the Treasury of the Athenians, the well-preserved theatre, and the stadium — climb the full path for the views. The on-site museum displays the bronze Charioteer (the most important surviving Greek bronze) and the marble omphalos that marked Delphi as the centre of the world. A guided visit is the standard format because most carved inscriptions and treasury attributions are not signposted.',
    skipTheLineTip: 'Delphi rarely has queues — even in peak July–August. The challenge is heat and shade rather than crowds. Time the climb for early morning; the upper site (theatre, stadium) is in full sun by 11am.',
    faqs: [
      { q: 'How long does it take to visit Delphi?', a: 'Plan 2–3 hours including the on-site museum. The full archaeological zone is a 1.5 km uphill walk; the stadium at the top adds another 400 m of climbing. Allow longer if you want to climb to the Sikelianos statue at the very top.' },
      { q: 'Can you visit Delphi without a guide?', a: 'Yes — the site is open to independent visitors and audio guides are available at the entrance. A guided tour adds substantial context (most ruins lack interpretive signage), but is not required.' },
      { q: 'Is Delphi worth a day trip from Athens?', a: 'Yes — Delphi is the highest-impact single-day trip from Athens. The combination of the archaeological zone, the museum, and the mountain setting on Parnassus is unmatched on the Greek mainland.' },
      { q: 'What is the best month to visit Delphi?', a: 'April–May and September–October are ideal. Spring brings wildflowers across Parnassus; autumn offers warm days and fewer crowds. Summer is doable but plan an early morning to beat heat.' },
    ],
  },

  // -------- TURKEY --------
  {
    slug: 'hagia-sophia',
    name: 'Hagia Sophia',
    city: 'Istanbul',
    country: 'Turkey',
    category: 'religious',
    isUnesco: true,
    ticketPrice: '€25 (upper gallery)',
    visitDuration: '45–90 minutes',
    bestTime: 'Early morning before 9am; closed during prayer times',
    geo: { lat: 41.0086, lng: 28.9802 },
    heroImage: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Hagia Sophia is the 6th-century Byzantine basilica that became an Ottoman mosque, then a museum, and is now a working mosque again. The ground-floor prayer hall is free for visitors during non-prayer hours; the upper gallery (where the Byzantine mosaics are visible) requires a paid ticket. The mosaics survived the Ottoman conversion under plaster and were restored in the 20th century — the Christ Pantocrator above the apse is the single most-photographed image in the building. Modest dress is required: shoulders and knees covered; women need a head covering inside (provided at entry).',
    skipTheLineTip: 'Hagia Sophia\'s ticket line for the upper gallery can run 45+ minutes in summer. Pre-book online via the official Müze Pass app or join a guided tour with included skip-the-line. Avoid Friday lunchtime when prayer service closes the building 12–2pm.',
    faqs: [
      { q: 'How much does Hagia Sophia cost?', a: 'The upper gallery (where the Byzantine mosaics are visible) costs €25. The ground-floor prayer hall is free for visitors during non-prayer hours; modest dress is required.' },
      { q: 'When is Hagia Sophia closed?', a: 'Hagia Sophia closes for the five daily Islamic prayer times — typically 30 minutes around each. The Friday lunchtime prayer (around 12–2pm) is the longest closure. Plan visits for early morning or late afternoon.' },
      { q: 'What should I wear to visit Hagia Sophia?', a: 'Modest dress required: shoulders and knees covered for everyone; women need a head covering inside. Wraps and head scarves are provided at the entrance for visitors who arrive without.' },
      { q: 'Is Hagia Sophia worth visiting?', a: 'Yes — it is one of the most architecturally significant buildings in the world, layered with Byzantine and Ottoman history in a single space. Plan 45–90 minutes, longer if you want to study the mosaics in the upper gallery.' },
    ],
  },
  {
    slug: 'pamukkale-thermal-pools',
    name: 'Pamukkale Thermal Pools',
    city: 'Denizli',
    country: 'Turkey',
    category: 'natural',
    isUnesco: true,
    ticketPrice: '€20 (combined with Hierapolis)',
    visitDuration: '3–4 hours',
    bestTime: 'Sunset for golden-hour photos; sunrise for empty pools',
    geo: { lat: 37.9210, lng: 29.1289 },
    heroImage: 'https://images.unsplash.com/photo-1591293836027-e05b48473b67?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Pamukkale ("cotton castle" in Turkish) is a series of white travertine terraces formed by thermal-spring calcium deposits over millennia, fed by hot mineral water that visitors can wade in. The site is paired with the ancient city of Hierapolis above — a Roman-era spa town with one of the best-preserved theatres in Anatolia. Visitors must remove shoes to walk on the travertines (the surface is soft and easily damaged). The white pools photograph best at sunset; sunrise is the quietest time. Cleopatra\'s Pool inside Hierapolis (an extra fee) is a thermal pool with submerged Roman columns.',
    skipTheLineTip: 'Pamukkale is rarely queued — the bottleneck is parking, not tickets. Arrive at 7am for the empty travertines or stay through 6pm for sunset. Avoid the midday tour-bus arrivals from Antalya and Kuşadası (10am–3pm).',
    faqs: [
      { q: 'How much does Pamukkale cost?', a: 'The combined Pamukkale + Hierapolis ticket is €20. Cleopatra\'s Pool (the swimmable thermal pool with Roman columns) is a separate €15.' },
      { q: 'How long do you need at Pamukkale?', a: 'Plan 3–4 hours minimum. The travertines take 90 minutes; Hierapolis archaeological site adds another 1.5–2 hours, plus optional swim in Cleopatra\'s Pool.' },
      { q: 'Can you swim at Pamukkale?', a: 'Yes — visitors can wade barefoot in the travertine pools (shoes must be removed to protect the surface). For a full swim, the separately-ticketed Cleopatra\'s Pool inside Hierapolis is the place.' },
      { q: 'Is Pamukkale worth a day trip from Antalya or Kuşadası?', a: 'Yes — Pamukkale is the headline natural attraction in Anatolia and is reachable as a long day trip from both cities (3 hours each way). Most travellers prefer to overnight in Pamukkale or Denizli to avoid 6 hours of bus time.' },
    ],
  },
  {
    slug: 'cappadocia-fairy-chimneys',
    name: 'Cappadocia Fairy Chimneys',
    city: 'Cappadocia',
    country: 'Turkey',
    category: 'natural',
    isUnesco: true,
    ticketPrice: 'Free (open landscape); €15 for Göreme Open-Air Museum',
    visitDuration: '1–2 days',
    bestTime: 'Sunrise for hot-air balloons; April–June and September–October for reliable balloon weather',
    geo: { lat: 38.6431, lng: 34.8289 },
    heroImage: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Cappadocia\'s fairy chimneys are volcanic rock spires carved by erosion into surreal pillar-shaped formations, scattered across the Göreme region of central Turkey. The most-photographed concentration is in Devrent Valley (the "imagination valley"), Pasabag (with multi-cap chimneys), and Love Valley. The Göreme Open-Air Museum is a UNESCO-listed cluster of rock-carved Byzantine churches with frescoed interiors — a separate ticketed site within the same valley. Hot-air balloon flights at sunrise are the iconic Cappadocia experience; balloons launch April–November weather-permitting.',
    skipTheLineTip: 'The Göreme Open-Air Museum has a single afternoon ticket window that queues 30–45 minutes mid-day. Visit at 8am opening or after 4pm. Hot-air balloon flights cancel for high winds — book your stay so you have a buffer day to retry if your scheduled flight cancels.',
    faqs: [
      { q: 'How much does it cost to visit Cappadocia\'s fairy chimneys?', a: 'The fairy-chimney landscape itself is free to walk through. Göreme Open-Air Museum (the rock-cut Byzantine churches) is €15. Hot-air balloon flights run €180–250 per person.' },
      { q: 'When is the best time to see Cappadocia?', a: 'April–June and September–October offer the most reliable hot-air-balloon weather and pleasant temperatures (15–25°C). Winter (December–March) gives snow-on-fairy-chimney photos but more balloon cancellations.' },
      { q: 'Are hot-air balloon flights guaranteed in Cappadocia?', a: 'No — flights cancel in 25–35% of winter mornings and 10–15% of summer mornings due to wind. Book a 2-night minimum stay so a cancelled flight can rebook the next day.' },
      { q: 'Can you walk through Cappadocia without a tour?', a: 'Yes — the Red Valley and Rose Valley have well-marked trails, and Göreme village has rental ATVs and horseback options. A guided Red Tour is the standard introduction; independent walking is feasible afterwards.' },
    ],
  },

  // -------- ITALY --------
  {
    slug: 'colosseum',
    name: 'Colosseum',
    city: 'Rome',
    country: 'Italy',
    category: 'archaeological',
    isUnesco: true,
    officialUrl: 'https://parcocolosseo.it',
    ticketPrice: '€16 (combined Colosseum + Forum + Palatine)',
    visitDuration: '2–3 hours including Forum',
    bestTime: 'Early morning at 9am opening; or late afternoon entry',
    geo: { lat: 41.8902, lng: 12.4922 },
    heroImage: 'https://images.unsplash.com/photo-1552432552-06c0b0a94dda?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'The Colosseum is Rome\'s 1st-century AD amphitheatre, originally seating 50,000 spectators for gladiatorial games, naval battles, and animal hunts. The standard ticket is a combined entry that also covers the Roman Forum and Palatine Hill across the road — together they form Rome\'s ancient core. The Underground (hypogeum) and Arena Floor are upgraded experiences that require timed booking. The site sees 7+ million visitors a year and pre-booking is essentially mandatory in summer.',
    skipTheLineTip: 'The Colosseum ticket window can run 90+ minutes in summer. ALL travellers should pre-book a timed slot through parcocolosseo.it (official site, no markup) at least 48 hours ahead. Guided tours include skip-the-line entry as standard.',
    faqs: [
      { q: 'How much does the Colosseum cost?', a: 'The standard combined Colosseum + Forum + Palatine ticket is €16. Underground and Arena Floor upgrades are €24–30. Tickets are valid for 24 hours but only one entry per zone.' },
      { q: 'Can you visit the Colosseum without a guide?', a: 'Yes — the site is well-signposted and audio guides are available. A guided tour adds context for the gladiatorial games and architectural details, and bundles skip-the-line entry; independent visits work fine for travellers comfortable reading on their own.' },
      { q: 'When does the Colosseum open?', a: 'The Colosseum opens at 9am year-round; closing time varies by season (4:30pm winter, 7:15pm summer). Last entry is one hour before closing. Pre-booked timed slots are released for 9am, 9:30am, 10am, etc.' },
      { q: 'How long do you need at the Colosseum?', a: 'Plan 1.5 hours for the Colosseum itself plus 1.5–2 hours for the Forum and Palatine across the road. The full archaeological zone is a half-day commitment.' },
    ],
  },
  {
    slug: 'pantheon',
    name: 'Pantheon',
    city: 'Rome',
    country: 'Italy',
    category: 'religious',
    isUnesco: true,
    ticketPrice: '€5 (free for residents and during Mass)',
    visitDuration: '20–45 minutes',
    bestTime: 'Late afternoon for the oculus light, or right at 9am opening',
    geo: { lat: 41.8986, lng: 12.4769 },
    heroImage: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'The Pantheon is the best-preserved building from ancient Rome, a 2nd-century AD temple converted into a church in the 7th century. The unreinforced concrete dome was the largest in the world for 1,300 years and remains the largest unreinforced concrete dome ever built. The 9-metre oculus at the centre is the only light source — when it rains, drainage holes in the floor below carry the water away. The interior houses the tombs of Raphael and the first two kings of unified Italy. Mass is held Sundays and admission is free during services.',
    skipTheLineTip: 'The Pantheon now charges €5 entry (changed from free admission in 2023). Pre-book online to skip the queue in summer; mid-day queues run 30–45 minutes. Visiting during a Sunday Mass is free but you can\'t walk around.',
    faqs: [
      { q: 'How much does the Pantheon cost?', a: 'The Pantheon costs €5 for visitors. Entry is free for Rome residents and free for everyone during Sunday Mass services. Tickets can be pre-booked online to skip the queue.' },
      { q: 'How long do you need at the Pantheon?', a: 'Plan 20–45 minutes — the interior is a single rotunda, but the dome and oculus reward extended viewing. A guided tour adds 15 minutes of architectural context; many Rome walking tours include a Pantheon stop.' },
      { q: 'When is the best time to visit the Pantheon?', a: 'Right at 9am opening or in the last hour before close. The mid-afternoon (1–4pm) sees the longest queues. The oculus light angles into the dome dramatically around 11am in spring/autumn.' },
      { q: 'Is the Pantheon worth visiting?', a: 'Yes — it is the best-preserved ancient Roman building and a 30-minute visit is one of the highest-impact uses of time in Rome. The €5 entry is a bargain compared to most major attractions.' },
    ],
  },

  // -------- ALBANIA + BULGARIA --------
  {
    slug: 'butrint-archaeological-site',
    name: 'Butrint Archaeological Site',
    city: 'Saranda',
    country: 'Albania',
    category: 'archaeological',
    isUnesco: true,
    ticketPrice: '€7',
    visitDuration: '2–3 hours',
    bestTime: 'Morning April–October to avoid heat',
    geo: { lat: 39.7464, lng: 20.0244 },
    heroImage: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Butrint is Albania\'s most-visited archaeological site, a UNESCO-listed peninsula 18 km south of Saranda layered with Greek, Roman, Byzantine, Venetian, and Ottoman ruins. The 4th-century BC Greek theatre, the 5th-century AD baptistery (with one of the most important early-Christian mosaic floors in Europe), and the Venetian fortress at the top of the hill are the highlights. The site is set inside a national park with wetlands and birdlife, making it as much a nature visit as an archaeology one. The combination of preservation, layered history, and waterfront setting makes it unmatched on the Albanian Ionian coast.',
    skipTheLineTip: 'Butrint rarely has queues. The challenge is the boat-traffic crossing of the Vivari Channel from the parking lot — it backs up at midday in July–August. Arrive before 10am or after 3pm.',
    faqs: [
      { q: 'How much does Butrint cost?', a: 'Entry to Butrint is €7 per person. The on-site museum (a small but well-curated space) is included. A guided audio tour is an extra €5.' },
      { q: 'How do you get to Butrint?', a: 'Butrint is 18 km south of Saranda, reachable by car (30 min), local bus from Saranda (every 30 min, €1), or guided tour from Saranda or Ksamil hotels. Most travellers visit as part of a Saranda-based day trip.' },
      { q: 'Is Butrint worth visiting?', a: 'Yes — it is the highest-impact single archaeological site on the Albanian Ionian coast and one of the best-preserved layered ancient sites in the Balkans. Plan 2–3 hours including the museum.' },
      { q: 'When is the best time to visit Butrint?', a: 'April–June and September–October for ideal weather. Summer (July–August) is hot and crowded with day-trippers from Corfu; mornings are bearable. Winter access is limited by reduced ferry schedules.' },
    ],
  },
  {
    slug: 'rila-monastery',
    name: 'Rila Monastery',
    city: 'Sofia',
    country: 'Bulgaria',
    category: 'religious',
    isUnesco: true,
    ticketPrice: 'Free (small donation suggested)',
    visitDuration: '2–3 hours including museum',
    bestTime: 'Morning April–October; the monastery is open year-round',
    geo: { lat: 42.1336, lng: 23.3403 },
    heroImage: 'https://images.unsplash.com/photo-1590424542300-94a3b85d68a2?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Rila Monastery is Bulgaria\'s largest and most important Orthodox monastery, founded in the 10th century and rebuilt in its current form in the 19th. The complex sits 1,150 m up in the Rila Mountains, 120 km south of Sofia. The vivid frescoed exterior of the main church (the Church of the Nativity) is the most-photographed religious image in Bulgaria; the on-site museum holds the 18th-century Rafail Cross with 140 microscopic biblical scenes carved by hand. The monastery is a working religious community — modest dress required, and quiet expected during services.',
    faqs: [
      { q: 'How much does Rila Monastery cost?', a: 'Entry to the main monastery courtyard and church is free; a small donation is suggested. The museum (which displays the famous Rafail Cross) costs €4. Photography is free outside, prohibited inside the church.' },
      { q: 'How do you get to Rila Monastery from Sofia?', a: 'Rila is 120 km south of Sofia, a 2-hour drive. Most travellers visit on a guided day trip from Sofia (8 hours total with hotel pickup). Independent options include the daily 10:20am bus from Sofia\'s Ovcha Kupel station.' },
      { q: 'When is the best time to visit Rila Monastery?', a: 'April–October offers the best weather for the surrounding Rila Mountains; the monastery itself is open year-round. Winter visits add snow-on-frescoes photography but reduce the bus schedule.' },
      { q: 'Is Rila Monastery worth a day trip from Sofia?', a: 'Yes — Rila is Bulgaria\'s most significant cultural site and the most popular day trip from Sofia. The combination of the monastery, the Rila Mountains, and the Rafail Cross museum justifies the 2-hour each-way drive.' },
    ],
  },

  // -------- GREECE (additional) --------
  {
    slug: 'knossos-palace',
    name: 'Palace of Knossos',
    city: 'Heraklion',
    country: 'Greece',
    category: 'archaeological',
    isUnesco: false,
    ticketPrice: '€15 (combined Heraklion Museum: €20)',
    visitDuration: '2–3 hours; pair with the Heraklion Museum for a full day',
    bestTime: 'Early morning April–October; midday on the rock is fully exposed in summer',
    geo: { lat: 35.2978, lng: 25.1631 },
    heroImage: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Knossos is the centre of Bronze-Age Minoan civilisation, the oldest city in Europe and the source of the Minotaur and Labyrinth myths. Excavated and partially reconstructed by Sir Arthur Evans starting in 1900, the palace covers 20,000 square metres of throne rooms, frescoed apartments, and elaborate plumbing that pre-dates Roman engineering by 1,500 years. The famous Bull-Leaping fresco and the Throne Room are the headline stops; pair the visit with the Heraklion Archaeological Museum, which holds the original frescoes and most of the Minoan artefact collection.',
    skipTheLineTip: 'Knossos pre-bookings via the official Hellenic Heritage online ticket portal save 30–60 minutes of summer queueing. Avoid mid-day arrival in July–August; the site has limited shade.',
    faqs: [
      { q: 'How much does Knossos cost?', a: 'Knossos entry is €15 (€8 reduced). A combined ticket with the Heraklion Archaeological Museum is €20 and includes both the site and the museum where most original Minoan artefacts are displayed.' },
      { q: 'Is Knossos worth visiting?', a: 'Yes — it is the most significant archaeological site on Crete and among the most important in Europe. The reconstructed sections are controversial among purists but make the layout legible to non-specialists. Plan 2–3 hours.' },
      { q: 'How do I get to Knossos from Heraklion?', a: 'Knossos is 5 km south of Heraklion, reachable by city bus #2 from the central station (every 20 min, €2) or by taxi (€10–12). Most guided Crete tours include hotel pickup.' },
      { q: 'When is the best time to visit Knossos?', a: 'April–May and September–October for ideal temperatures and lighter crowds. Summer is doable but plan an 8am opening arrival. Winter access is limited but possible — fewer crowds, intermittent rain.' },
    ],
  },
  {
    slug: 'olympia-archaeological-site',
    name: 'Ancient Olympia',
    city: 'Olympia',
    country: 'Greece',
    category: 'archaeological',
    isUnesco: true,
    ticketPrice: '€12 (combined site + museum)',
    visitDuration: '3–4 hours including museum',
    bestTime: 'Spring and autumn; summer mornings before 10am',
    geo: { lat: 37.6383, lng: 21.6300 },
    heroImage: 'https://images.unsplash.com/photo-1589485257739-3e15dad9f72a?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Ancient Olympia hosted the original Olympic Games from 776 BC to AD 393, a 1,200-year run that produced the longest-serving athletic festival in human history. The archaeological zone preserves the Temple of Zeus, the Temple of Hera (where the Olympic torch is still lit every four years), the original stadium with its starting line intact, and the workshop where Phidias sculpted the Statue of Zeus, one of the Seven Wonders of the Ancient World. The on-site Archaeological Museum holds the Hermes of Praxiteles and the pediment sculptures of the Temple of Zeus.',
    faqs: [
      { q: 'How much does Ancient Olympia cost?', a: 'The combined Ancient Olympia + Archaeological Museum ticket is €12. Tickets are valid for 24 hours and can be pre-booked via the official Hellenic Heritage portal.' },
      { q: 'How do I get to Olympia?', a: 'Ancient Olympia is in the western Peloponnese, 4 hours west of Athens by car. Most travellers visit on a 2-day Peloponnese loop or as a long day trip from Patras (1 hour) or Kalamata (2 hours).' },
      { q: 'Is Ancient Olympia worth visiting?', a: 'Yes for travellers interested in classical Greek history. The combination of the temples, the original Olympic stadium, and the museum sculptures makes it one of the most significant archaeological zones in Greece.' },
      { q: 'When is the best time for Olympia?', a: 'April–May and September–October offer the best weather. Summer is hot and exposed; winter is mild but operator schedules drop. The torch-lighting ceremony every four years (next: 2028) draws crowds.' },
    ],
  },
  {
    slug: 'samaria-gorge',
    name: 'Samaria Gorge',
    city: 'Chania',
    country: 'Greece',
    category: 'natural',
    isUnesco: false,
    ticketPrice: '€5 (national park entry)',
    visitDuration: '6–8 hours hiking',
    bestTime: 'Early morning May to October; closed mid-October to early May for safety',
    geo: { lat: 35.2987, lng: 23.9678 },
    heroImage: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'The Samaria Gorge is one of Europe\'s longest canyons, 16 km from the highland Omalos plateau down to the Libyan Sea at Agia Roumeli. The classic walk descends 1,200 m through pine forests, past abandoned Byzantine villages, through the famous Iron Gates (a 3-metre-wide rock chasm), and ends at a black-sand beach with a ferry connection back. The full hike takes 6–8 hours and is the single most-walked long trail in Greece. The reverse direction (uphill from Agia Roumeli) is brutal and rarely attempted; nearly all walkers go top-down.',
    skipTheLineTip: 'The 5,000-walker daily cap is rarely hit, but the 7am pre-dawn coach departure from Chania is the only way to be at the Omalos trailhead by 8am opening. Tour operators handle the multi-step return logistics (boat from Agia Roumeli to Sougia or Sfakia, then coach back to Chania).',
    faqs: [
      { q: 'How long is the Samaria Gorge hike?', a: 'The classic top-down hike is 16 km from Omalos to Agia Roumeli, taking 6–8 hours including breaks. There\'s no shortcut — once you start descending, you must walk to the sea.' },
      { q: 'Is the Samaria Gorge difficult?', a: 'Moderate. The trail is rocky and steep in sections, but the descent is mostly cumulative with frequent rest stops. Knee-strain is the most common complaint; trekking poles are strongly recommended.' },
      { q: 'When is Samaria Gorge open?', a: 'May 1 to October 15 typically. The trail closes for winter due to flash-flood and rockfall risk. June and September offer the best balance of weather and crowd levels.' },
      { q: 'Can I do Samaria Gorge as a day trip from Heraklion?', a: 'Yes but the day is long — 14+ hours total with the 3-hour drive each way and the gorge walk. Chania-based stays are easier; many western Crete tours start the gorge hike from Chania.' },
    ],
  },

  // -------- TURKEY (additional) --------
  {
    slug: 'topkapi-palace',
    name: 'Topkapi Palace',
    city: 'Istanbul',
    country: 'Turkey',
    category: 'palace',
    isUnesco: true,
    ticketPrice: '€20 (€30 with Harem upgrade)',
    visitDuration: '3–4 hours including Harem',
    bestTime: 'Morning before 10am; closed Tuesdays',
    geo: { lat: 41.0115, lng: 28.9833 },
    heroImage: 'https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Topkapi Palace was the primary residence of Ottoman sultans for 400 years (1465–1856) and is now a museum holding the Sacred Trust (Islamic relics including the Prophet Muhammad\'s cloak and the staff of Moses) and the Imperial Treasury (the Topkapi Dagger and the 86-carat Spoonmaker\'s Diamond). The palace covers four courtyards and the Harem, the private quarters of the sultan\'s family. The Harem requires a separate ticket but is worth the upgrade for the tile work and the calligraphy. Plan a half-day; most travellers underestimate the scale.',
    skipTheLineTip: 'The combined Topkapi + Harem ticket queue can run 60+ minutes in summer. Pre-book via the official Müze Pass app or join a guided tour with skip-the-line included. Tuesdays are closed; Wednesdays after Tuesday-closure are the busiest day of the week.',
    faqs: [
      { q: 'How much does Topkapi Palace cost?', a: 'Topkapi entry is €20; the Harem upgrade adds €10 for a combined €30. The Hagia Sophia upper gallery and Topkapi together are €45 for a full Sultanahmet imperial circuit.' },
      { q: 'Is the Harem worth the upgrade?', a: 'Yes for first-time visitors — the tilework in the Harem is among the finest in the Islamic world and includes rooms not accessible elsewhere in Istanbul. Plan an extra hour for the upgraded route.' },
      { q: 'How long do you need at Topkapi?', a: 'Plan 3–4 hours including the Harem and the Imperial Treasury. The four courtyards are spread across 700,000 square metres; allow walking time between them.' },
      { q: 'When is Topkapi closed?', a: 'Tuesdays year-round. Standard hours are 9am–6:45pm summer, 9am–4:45pm winter. Last entry one hour before close. Pre-booking is mandatory in summer.' },
    ],
  },
  {
    slug: 'ephesus-ancient-city',
    name: 'Ephesus',
    city: 'Selcuk',
    country: 'Turkey',
    category: 'archaeological',
    isUnesco: true,
    ticketPrice: '€20 (€30 with Terrace Houses)',
    visitDuration: '3–5 hours',
    bestTime: 'Morning April–October; arrive at 8am opening',
    geo: { lat: 37.9395, lng: 27.3417 },
    heroImage: 'https://images.unsplash.com/photo-1601595900113-e4ec73aaf9c3?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Ephesus is the best-preserved Roman city in the eastern Mediterranean, capital of the Roman province of Asia and one of the largest cities of the ancient world (250,000 inhabitants at peak). The Library of Celsus is the most-photographed facade in Turkey; the 25,000-seat Great Theatre is still used for summer concerts. The optional Terrace Houses upgrade reveals 1st-century AD wealthy households with intact mosaics, frescoed walls, and underfloor heating systems — comparable to Pompeii but better preserved. The Temple of Artemis, one of the Seven Wonders of the Ancient World, is reduced to a single column 1 km north of the main site.',
    skipTheLineTip: 'Cruise-ship tours from Kusadasi flood the site between 10am and 1pm. Arrive at 8am or after 4pm; the Library of Celsus is photographable in low-angle light at both ends of the day. The Terrace Houses entry has its own queue; book ahead in summer.',
    faqs: [
      { q: 'How much does Ephesus cost?', a: 'Standard Ephesus entry is €20. The Terrace Houses upgrade is €10 extra (combined €30). The Ephesus Museum in Selcuk is €5 separately and holds the original sculptures from the site.' },
      { q: 'Are the Terrace Houses worth the extra ticket?', a: 'Yes for travellers interested in domestic Roman life. The Terrace Houses preserve mosaics and frescoes from 1st-century AD wealthy households at a level of detail Pompeii rarely matches. Allow an extra hour.' },
      { q: 'How long do you need at Ephesus?', a: 'Plan 3–5 hours including the Terrace Houses. The site is 1.5 km long with no shade; bring water and sun protection. A guided 3-hour tour covers the main monuments efficiently.' },
      { q: 'How do I get to Ephesus?', a: 'Ephesus is 3 km from Selcuk town. Most travellers base in Selcuk (closest hotels) or Kusadasi (closer to the cruise port, 25 km away). Domestic flights to Izmir Adnan Menderes airport, then 50-minute drive south.' },
    ],
  },

  // -------- ITALY (additional) --------
  {
    slug: 'vatican-museums',
    name: 'Vatican Museums',
    city: 'Rome',
    country: 'Italy',
    category: 'museum',
    isUnesco: true,
    officialUrl: 'https://www.museivaticani.va',
    ticketPrice: '€17 standard (€25 fast-track)',
    visitDuration: '3–5 hours including Sistine Chapel',
    bestTime: 'Friday or Saturday evening (less crowded); avoid Wednesday morning (Papal Audience)',
    geo: { lat: 41.9067, lng: 12.4537 },
    heroImage: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'The Vatican Museums hold one of the largest art collections in the world, accumulated by Catholic Popes over five centuries. The route covers the Pio-Clementino classical sculpture wing (Laocoön, Apollo Belvedere), the Gallery of Maps, the Raphael Rooms, and culminates in the Sistine Chapel with Michelangelo\'s ceiling and Last Judgment frescoes. Plan a half-day at minimum; the full route is 7 km of corridors. Modest dress is required throughout — covered shoulders and knees, no exceptions. Photography is permitted except in the Sistine Chapel.',
    skipTheLineTip: 'The standard ticket queue can run 90 minutes to 3 hours in peak summer. Pre-book a timed slot via museivaticani.va (official, no markup) or via a guided tour with skip-the-line included. Friday and Saturday evening openings (April–October) are noticeably less crowded than morning slots.',
    faqs: [
      { q: 'How much do the Vatican Museums cost?', a: 'Standard ticket is €17, fast-track skip-the-line is €25. Guided tours with skip-the-line typically run €60–90 per person and include the entry fee. Children under 6 are free.' },
      { q: 'Is a guided Vatican tour worth it?', a: 'For first-time visitors yes — the museums are vast (54 galleries), poorly signposted in places, and the Sistine Chapel context dramatically lifts the experience. Self-guided audio tours are a cheaper middle ground.' },
      { q: 'What should I wear to the Vatican?', a: 'Modest dress required: shoulders and knees covered for everyone. Visitors who arrive in shorts or sleeveless tops are turned away. Wraps and shawls are sold at the entrance for last-minute coverage.' },
      { q: 'When is the best time to visit the Vatican Museums?', a: 'Friday or Saturday evening openings (April–October, last entry 9pm) are the least crowded. Avoid Wednesday morning when the Papal Audience overlaps. Tuesday and Thursday mornings are middle-ground.' },
    ],
  },
  {
    slug: 'pompeii',
    name: 'Pompeii',
    city: 'Naples',
    country: 'Italy',
    category: 'archaeological',
    isUnesco: true,
    ticketPrice: '€18',
    visitDuration: '4–6 hours',
    bestTime: 'Morning April–October; arrive at 9am opening',
    geo: { lat: 40.7497, lng: 14.4869 },
    heroImage: 'https://images.unsplash.com/photo-1582879200-f5c5e15e3700?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Pompeii is the Roman city buried by the Vesuvius eruption of AD 79 and rediscovered in 1748. Two thousand years of preservation under volcanic ash created the most complete picture of daily Roman life that exists anywhere — fully furnished houses, intact frescoes, the Lupanar (the city brothel with painted menus), the bakery, the laundry, and the famous body casts of victims preserved in their final positions. The site covers 66 hectares; plan a half-day minimum. Pair with the Naples Archaeological Museum, which holds the most important removed frescoes and bronzes.',
    skipTheLineTip: 'Pompeii\'s ticket window can run 60+ minutes mid-day in summer. Pre-book via pompeiisites.org (official). Most Naples-based tours include skip-the-line as standard. The Villa of the Mysteries (a separately-fenced building 800 m beyond the main city gates) often closes for restoration; check the official opening calendar before travelling.',
    faqs: [
      { q: 'How much does Pompeii cost?', a: 'Standard ticket is €18. A combined ticket including Herculaneum, Boscoreale, Oplontis, and Stabia is €22 and is valid for 3 days — strongly worth it for travellers interested in the broader Vesuvius archaeological zone.' },
      { q: 'How long do you need at Pompeii?', a: 'Plan 4–6 hours minimum. The site is 66 hectares with no shade in the main streets; bring 2 litres of water in summer. A guided 3-hour tour covers the highlights but skips much of the residential zone.' },
      { q: 'Should I visit Pompeii or Herculaneum?', a: 'Both if possible. Pompeii is larger and more famous; Herculaneum is smaller but better-preserved (the carbonised wooden beams and original second-storey balconies survive). Combined-ticket access makes both viable in a single day.' },
      { q: 'How do I get to Pompeii from Rome?', a: 'High-speed train to Naples (70 minutes), then Circumvesuviana commuter rail to Pompeii Scavi-Villa dei Misteri (35 minutes). Most Rome-based Pompeii day tours handle the multi-step transfer.' },
    ],
  },
  {
    slug: 'cinque-terre-trail',
    name: 'Cinque Terre Coastal Trail',
    city: 'La Spezia',
    country: 'Italy',
    category: 'natural',
    isUnesco: true,
    ticketPrice: '€7.50 daily Cinque Terre Card (trail + bus); €18 with rail',
    visitDuration: '5–8 hours for full Sentiero Azzurro',
    bestTime: 'May, early June, September, early October; avoid August heat',
    geo: { lat: 44.1097, lng: 9.7178 },
    heroImage: 'https://images.unsplash.com/photo-1543242748-9aae7d8b8a4f?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'The Cinque Terre is a UNESCO-protected stretch of the Italian Riviera, five fishing villages strung along 12 km of cliff-side coastline: Monterosso, Vernazza, Corniglia, Manarola, and Riomaggiore. The Sentiero Azzurro (Blue Trail) is the classic hiking route linking the villages on foot; sections close periodically for landslide repair. When the trail is fully open, the full Monterosso-to-Riomaggiore walk takes 5–8 hours including stops. The cheaper alternative is the regional rail line that links all five villages with 5-minute hops between stations. Combine both for the best experience.',
    skipTheLineTip: 'The Cinque Terre Card skips the queue at every trail-checkpoint hut and includes unlimited regional bus and (premium tier) train access. The Vernazza-Corniglia path is the most-popular section; arrive at 8am to walk it without congestion. Manarola is the most-photographed sunset viewpoint.',
    faqs: [
      { q: 'How long is the Cinque Terre coastal trail?', a: 'The full Sentiero Azzurro from Monterosso to Riomaggiore is 12 km, taking 5–8 hours with stops at each village. Many travellers walk just one or two sections and use the train for the rest.' },
      { q: 'Are all sections of the Cinque Terre trail open?', a: 'The trail closes sections periodically for landslide repair. Check the latest status at parconazionale5terre.it before travelling. The Vernazza-Corniglia and Vernazza-Monterosso sections are usually open; the Manarola-Riomaggiore "Via dell\'Amore" reopened in 2024 after a decade of closure.' },
      { q: 'When is the best time to visit Cinque Terre?', a: 'May, early June, and September deliver the best balance of weather, water temperature for swimming, and crowd levels. July–August is peak; the rail line and trail are extremely crowded.' },
      { q: 'Where should I stay in Cinque Terre?', a: 'Vernazza for the most picturesque stay (limited rooms; book 6+ months ahead in summer). Monterosso for beach access and the easiest hotel infrastructure. La Spezia (just outside the park) for cheaper rooms and a 5-minute train into Riomaggiore.' },
    ],
  },

  // -------- ALBANIA (additional) --------
  {
    slug: 'berat-old-town',
    name: 'Berat Old Town',
    city: 'Berat',
    country: 'Albania',
    category: 'urban',
    isUnesco: true,
    ticketPrice: 'Free (Berat Castle: €4)',
    visitDuration: '3–4 hours',
    bestTime: 'Spring and autumn; summer mornings and evenings',
    geo: { lat: 40.7058, lng: 19.9525 },
    heroImage: 'https://images.unsplash.com/photo-1574868036612-a51fbb46e527?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Berat is the "City of a Thousand Windows", a UNESCO-protected Albanian Ottoman-era town named for the rows of identical white-and-grey windows that stack the cliffside Mangalem and Gorica quarters along the Osum River. The hilltop castle is unusual for being still inhabited — Albanian families live inside the medieval walls, alongside the 13th-century Holy Trinity Church and the Onufri Museum (Albania\'s most important collection of Byzantine icons). The Ottoman bazaar at the bottom of the hill remains a working market. Berat fits between a Tirana arrival and a coastal Riviera leg.',
    faqs: [
      { q: 'How long do you need in Berat?', a: 'A half-day (3–4 hours) covers the castle, the Onufri Museum, and the Ottoman bazaar. A full day allows for a leisurely lunch at one of the Mangalem-quarter terrace restaurants and time inside several of the active churches.' },
      { q: 'How do I get to Berat?', a: 'Berat is 100 km south of Tirana, a 2-hour drive. Most travellers visit on a 1-night stay between Tirana and the Albanian Riviera. Daily buses run from Tirana\'s south bus station; rental cars give the most flexibility.' },
      { q: 'Is Berat worth a stop?', a: 'Yes — Berat is one of three UNESCO sites in Albania (with Butrint and Gjirokaster) and is the easiest culturally rewarding stop on a Tirana-to-Riviera circuit. The combination of architecture, the inhabited castle, and the Onufri icons justifies the detour.' },
      { q: 'When is the best month for Berat?', a: 'April–June and September–October. Summer (July–August) is hot and the cliff-facing Mangalem quarter has limited shade. Winter is mild but quieter; many small museums close mid-week.' },
    ],
  },
  {
    slug: 'gjirokaster-old-town',
    name: 'Gjirokaster Old Town',
    city: 'Gjirokaster',
    country: 'Albania',
    category: 'urban',
    isUnesco: true,
    ticketPrice: 'Free (Castle: €5)',
    visitDuration: '3–4 hours',
    bestTime: 'Spring and autumn',
    geo: { lat: 40.0758, lng: 20.1389 },
    heroImage: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Gjirokaster is a UNESCO-protected hilltop city in southern Albania, characterised by stone-roofed Ottoman-era tower houses (kullas) cascading down the slopes below a massive 13th-century castle. The castle holds the National Weapons Museum and a captured American spy plane from the Cold War. Author Ismail Kadare\'s childhood home is preserved as a museum; the local cuisine (oshaf, lamb-and-yogurt sauces) is the best of southern Albania. Gjirokaster fits between a coastal Riviera leg and the mountainous interior.',
    faqs: [
      { q: 'Is Gjirokaster worth visiting?', a: 'Yes — the stone-roofed Ottoman houses are the most architecturally distinctive in the Balkans, and the castle complex is unusually well-preserved. Plan 3–4 hours minimum.' },
      { q: 'How do I get to Gjirokaster?', a: 'Gjirokaster sits 1 hour north of Saranda and 4 hours south of Tirana. Most travellers visit on a 2-night stay during a Riviera-to-mountains transition. Daily buses run from Saranda and Tirana.' },
      { q: 'Should I combine Gjirokaster and Berat?', a: 'Yes — both are UNESCO Ottoman-era towns and complement each other. A 4-day combined visit (2 nights each) covers both; alternatively day-trip Gjirokaster from Saranda and Berat from Tirana on a longer Albania circuit.' },
      { q: 'What is special about Gjirokaster?', a: 'The stone-roof tower houses are unique to the region — large flat slabs of local stone replace traditional clay tiles. The castle\'s American spy plane is one of the more unusual museum exhibits in southern Europe.' },
    ],
  },

  // -------- BULGARIA (additional) --------
  {
    slug: 'plovdiv-old-town',
    name: 'Plovdiv Old Town',
    city: 'Plovdiv',
    country: 'Bulgaria',
    category: 'urban',
    isUnesco: false,
    ticketPrice: 'Free (Roman Theatre: €5)',
    visitDuration: '3–4 hours',
    bestTime: 'Spring through autumn; the Roman Theatre hosts summer concerts',
    geo: { lat: 42.1463, lng: 24.7494 },
    heroImage: 'https://images.unsplash.com/photo-1593696954577-ab3d39317b97?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Plovdiv is one of Europe\'s oldest continuously inhabited cities, with a 6,000-year archaeological record running from Thracian through Roman, Byzantine, Ottoman, and Bulgarian Revival periods. The Old Town\'s cobbled lanes wind past National Revival mansions, painted facades from the 19th century, and a 2nd-century AD Roman Theatre still in use for summer concerts. The Roman Forum and the partially-restored Roman Stadium sit beneath the modern city centre. Plovdiv was European Capital of Culture 2019, which drove substantial restoration.',
    faqs: [
      { q: 'How much time do you need in Plovdiv?', a: 'A half-day (3–4 hours) covers the Old Town, the Roman Theatre, and the Kapana arts district. A full day allows a relaxed lunch and time at the Ethnographic Museum or the Regional Archaeological Museum.' },
      { q: 'How do I get to Plovdiv from Sofia?', a: 'Plovdiv is 150 km southeast of Sofia, 1.5 hours by car or 2.5 hours by train. Most Bulgaria tours include Plovdiv as a 1-night stop between Sofia and Veliko Tarnovo.' },
      { q: 'When is the Roman Theatre in use?', a: 'The Roman Theatre hosts the Plovdiv summer festival (June–September) with concerts, opera, and theatre productions. Daytime visits are unrestricted unless a rehearsal or event is in progress.' },
      { q: 'Is Plovdiv worth visiting?', a: 'Yes — Plovdiv is Bulgaria\'s second city and one of the most architecturally rewarding in the Balkans. The combination of Roman ruins integrated into the modern street grid, the Bulgarian Revival Old Town, and the Kapana creative district makes it a top-3 Bulgaria destination.' },
    ],
  },
  {
    slug: 'tsarevets-fortress',
    name: 'Tsarevets Fortress',
    city: 'Veliko Tarnovo',
    country: 'Bulgaria',
    category: 'palace',
    isUnesco: false,
    ticketPrice: '€3',
    visitDuration: '2–3 hours',
    bestTime: 'Sunset for the Sound and Light show (summer evenings)',
    geo: { lat: 43.0817, lng: 25.6519 },
    heroImage: 'https://images.unsplash.com/photo-1601751123988-e0d4a3a3a3a3?w=2000&h=1000&fit=crop',
    updated: '2026-05-08',
    description: 'Tsarevets was the medieval capital of the Second Bulgarian Empire (1185–1393) and is still the symbolic heart of Bulgaria. The fortress occupies a peninsular rock loop in the Yantra River, with the reconstructed Patriarchal Cathedral of the Holy Ascension at its summit. The Sound and Light show on summer evenings projects the empire\'s rise and fall onto the fortress walls in a 30-minute multimedia performance — the most-cited Bulgarian travel experience and the single best reason to overnight in Veliko Tarnovo.',
    faqs: [
      { q: 'How much does Tsarevets Fortress cost?', a: 'Entry to the fortress is €3. The Sound and Light show (summer evenings, multiple times per week) is free but draws crowds — arrive 30 minutes early for a good viewpoint.' },
      { q: 'When is the Sound and Light show?', a: 'The show runs from May to October, typically 2–3 evenings per week (subject to weather and the local schedule). Each show is 30 minutes; check the Veliko Tarnovo tourist office for the current month\'s calendar.' },
      { q: 'How long do you need at Tsarevets?', a: 'Plan 2–3 hours during the day, plus a return visit at dusk for the Sound and Light show. The fortress is a 30-minute climb from the Old Town centre.' },
      { q: 'Is Veliko Tarnovo worth visiting?', a: 'Yes — Veliko Tarnovo is the most atmospheric historical town in Bulgaria, with the fortress, the Samovodska Charshia artisan street, and the medieval Old Town all walkable. Plan 2 nights minimum.' },
    ],
  },
];

// Slug-friendly normaliser. URL params arrive in slug form (la-spezia),
// while attraction data uses display form ("La Spezia"). Comparing both
// after slugify() lets multi-word cities match correctly.
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getAttraction(country: string, city: string, slug: string): Attraction | undefined {
  return ATTRACTIONS.find((a) =>
    a.slug === slug &&
    norm(a.country) === norm(country) &&
    norm(a.city) === norm(city),
  );
}

export function getAttractionsForCity(city: string): Attraction[] {
  return ATTRACTIONS.filter((a) => norm(a.city) === norm(city));
}
