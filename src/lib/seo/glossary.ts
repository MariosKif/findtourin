// Tour-industry glossary. Glossaries dominate AI Overview citations because
// LLMs prefer single-source definitional content — a well-organised glossary
// that defines 50+ terms in one place becomes the authority on those terms.
// Keep entries: 1-3 sentences, plain-English, with the term in bold form
// implied by the structure (the schema emits it as DefinedTerm.name).

export interface GlossaryTerm {
  term: string;
  /** URL-safe id used for #anchor links and DefinedTerm @id. */
  slug: string;
  /** 1-3 sentence definition. Lead with the most-citable single sentence. */
  definition: string;
  /** Primary category for filter chips: 'planning', 'logistics', 'roles',
   *  'tour-types', 'pricing', 'safety'. */
  category: 'planning' | 'logistics' | 'roles' | 'tour-types' | 'pricing' | 'safety';
}

export const GLOSSARY: GlossaryTerm[] = [
  // ---- TOUR TYPES ----
  { term: 'Group tour', slug: 'group-tour', category: 'tour-types', definition: 'A tour booked by individual travellers but run as a single party of typically 8–20 people sharing transport, accommodation, and a guide. Lower per-person cost than private but less flexible.' },
  { term: 'Private tour', slug: 'private-tour', category: 'tour-types', definition: 'A tour run exclusively for one party (a couple, family, or small group) with a dedicated guide and itinerary. More expensive than group tours but fully customisable.' },
  { term: 'Small-group tour', slug: 'small-group-tour', category: 'tour-types', definition: 'A group tour with a hard cap on group size — usually 4–12 travellers — to preserve guide attention and access to small venues. The format that dominates premium tour operators.' },
  { term: 'Day trip', slug: 'day-trip', category: 'tour-types', definition: 'A guided excursion lasting a single day, returning to the starting city the same night. Ranges from half-day (3–4 hours) to long full-day (10–14 hours).' },
  { term: 'Multi-day tour', slug: 'multi-day-tour', category: 'tour-types', definition: 'A tour spanning two or more days with overnight stays. Costs are usually quoted "land-only" (transport, guide, entries) with hotels priced separately or as an upgrade.' },
  { term: 'Walking tour', slug: 'walking-tour', category: 'tour-types', definition: 'A guided tour conducted entirely on foot, typically 2–4 hours covering 2–5 km. The default format for historic city centres where vehicles can\'t access narrow streets.' },
  { term: 'Free walking tour', slug: 'free-walking-tour', category: 'tour-types', definition: 'A tip-based walking tour, popular in European cities, where the guide works for tips paid at the end. Usually 2–3 hours; tipping €10–20 per person is standard.' },
  { term: 'Food tour', slug: 'food-tour', category: 'tour-types', definition: 'A guided walking tour built around tasting stops at local restaurants, markets, and food shops. Typically 3–4 hours with 6–10 stops; counts as a meal.' },
  { term: 'Hop-on hop-off', slug: 'hop-on-hop-off', category: 'tour-types', definition: 'A bus or boat tour with a 24- or 48-hour ticket allowing unlimited boardings at fixed stops. Best as a city overview on day 1, not a substitute for a guided tour.' },
  { term: 'Skip-the-line tour', slug: 'skip-the-line-tour', category: 'tour-types', definition: 'A tour bundle that includes pre-booked timed entry to a heavily-trafficked attraction (Vatican, Acropolis, Colosseum), bypassing the on-site queue. Saves 30–90 minutes in peak season.' },
  { term: 'Self-guided tour', slug: 'self-guided-tour', category: 'tour-types', definition: 'A pre-planned itinerary without a live guide, usually delivered as an audio guide, app, or printed guide. Cheaper than guided tours but requires more independent navigation.' },
  { term: 'Combo ticket', slug: 'combo-ticket', category: 'tour-types', definition: 'A single ticket bundling entry to two or more attractions at a discount versus buying individually. Pass-style products like the Vatican + Sistine Chapel are the most common combos.' },

  // ---- ROLES ----
  { term: 'Tour operator', slug: 'tour-operator', category: 'roles', definition: 'The company that designs and runs a tour — owning the logistics, guides, and supplier relationships. Tour operators are distinct from online travel agencies (OTAs) that resell tours but don\'t operate them.' },
  { term: 'Online travel agency (OTA)', slug: 'online-travel-agency', category: 'roles', definition: 'A platform like GetYourGuide, Viator, or Klook that aggregates tours from operators and sells them to travellers, taking a 20–30% commission. Travellers usually pay 15–25% more on OTAs than booking the operator directly.' },
  { term: 'Tour guide', slug: 'tour-guide', category: 'roles', definition: 'The on-the-ground person leading a tour, providing interpretation and logistics. Many countries (Italy, Greece, Turkey) require guides to hold a national certification.' },
  { term: 'Tour leader', slug: 'tour-leader', category: 'roles', definition: 'On multi-day group tours, the person travelling with the group from start to end — distinct from local guides who join for individual cities. Sometimes called a "tour director" or "trip leader".' },
  { term: 'DMC (Destination Management Company)', slug: 'dmc', category: 'roles', definition: 'A company specialising in on-the-ground services in a specific destination — transport, accommodation, ticketing — that operators or travel agents contract for trip components. Travellers rarely book DMCs directly.' },
  { term: 'Inbound tour operator', slug: 'inbound-tour-operator', category: 'roles', definition: 'A tour operator based in the destination country that designs tours for foreign travellers visiting. Local operators on FindToursIn are inbound operators.' },
  { term: 'Tour reseller', slug: 'tour-reseller', category: 'roles', definition: 'A company that sells tours operated by others, typically as an affiliate or for a commission. OTAs and many travel-blog sites are resellers.' },

  // ---- PLANNING ----
  { term: 'Itinerary', slug: 'itinerary', category: 'planning', definition: 'The day-by-day plan for a tour — listing destinations, activities, transport, and meals. Itineraries are typically published 4–6 months ahead but small details can change up to departure.' },
  { term: 'Shoulder season', slug: 'shoulder-season', category: 'planning', definition: 'The months bracketing peak tourist season (in Europe: April–May and September–October), with milder weather, lower prices, and lighter crowds. The ideal time for most cultural tours.' },
  { term: 'Peak season', slug: 'peak-season', category: 'planning', definition: 'The busiest months for a destination — for Mediterranean Europe, June through August. Prices are 30–60% higher than shoulder season and small-group tours sell out earliest.' },
  { term: 'High season', slug: 'high-season', category: 'planning', definition: 'A synonym for peak season, sometimes used by operators to distinguish two tiers of pricing — "high" (June, September) and "peak" (July, August).' },
  { term: 'Off-season (low season)', slug: 'off-season', category: 'planning', definition: 'The least-popular months for a destination — for Mediterranean Europe, November through March. Cheapest prices but reduced operator schedules and some sites closed.' },
  { term: 'Lead time', slug: 'lead-time', category: 'planning', definition: 'How far in advance a tour should be booked. For peak-season small-group tours, 8–12 weeks is standard. Last-minute bookings (under 2 weeks) work better in shoulder and off-season.' },
  { term: 'Cancellation policy', slug: 'cancellation-policy', category: 'planning', definition: 'The rules governing refunds when a traveller cancels. "Free cancellation up to 24 hours" is the OTA standard; multi-day tours often require 30–60 days notice for full refund.' },
  { term: 'Travel advisory', slug: 'travel-advisory', category: 'planning', definition: 'Government-issued guidance about safety, health, or political conditions in a destination. Most tour operators monitor advisories and will offer rebooking if the destination becomes flagged.' },

  // ---- PRICING ----
  { term: 'Land-only price', slug: 'land-only-price', category: 'pricing', definition: 'A multi-day-tour price that covers everything on the ground — transport, guides, entries, sometimes meals — but excludes flights to and from the destination. The standard format for tours sold to international travellers.' },
  { term: 'All-inclusive tour', slug: 'all-inclusive-tour', category: 'pricing', definition: 'A tour where every cost is bundled into the headline price — transport, accommodation, all meals, all activities. Common on cruises and luxury packages, rare on small-group cultural tours.' },
  { term: 'Single supplement', slug: 'single-supplement', category: 'pricing', definition: 'An extra fee charged to a solo traveller on a tour priced per-room. Usually 30–80% of the base price; some operators waive it on shoulder-season departures to fill rooms.' },
  { term: 'Per-person twin share', slug: 'per-person-twin-share', category: 'pricing', definition: 'The standard pricing convention for multi-day tours — the price assumes two travellers sharing a twin or double room. Solo travellers pay base + single supplement.' },
  { term: 'Booking deposit', slug: 'booking-deposit', category: 'pricing', definition: 'A partial payment (typically 10–30%) made to confirm a tour reservation, with the balance due 30–60 days before departure. Deposits are usually non-refundable if you cancel.' },
  { term: 'Service charge', slug: 'service-charge', category: 'pricing', definition: 'A fee added by some operators to cover transaction costs or guide gratuities, distinct from the tour price. Always confirm whether the headline price includes service charge.' },
  { term: 'Booking fee', slug: 'booking-fee', category: 'pricing', definition: 'A platform fee charged by some OTAs on top of the tour price, often €1–5 per person. FindToursIn does not charge booking fees — travellers pay the agency directly.' },

  // ---- LOGISTICS ----
  { term: 'Pickup point', slug: 'pickup-point', category: 'logistics', definition: 'The agreed location where a tour collects its passengers — typically a hotel, central square, or transport hub. Tours with hotel pickup save 30–60 minutes versus meet-at-location formats.' },
  { term: 'Meet-at-location', slug: 'meet-at-location', category: 'logistics', definition: 'A tour starting format where travellers make their own way to the meeting point (a museum entrance, a port). Cheaper than hotel pickup; allow 30 minutes\' margin to find the spot.' },
  { term: 'Hotel transfer', slug: 'hotel-transfer', category: 'logistics', definition: 'Pre-booked private or shared transport between a hotel and an airport, port, or tour starting point. Distinct from a tour itself.' },
  { term: 'Group cap', slug: 'group-cap', category: 'logistics', definition: 'The maximum number of travellers on a group tour. Reputable small-group operators cap at 12–16; mass-market operators run 30–50.' },
  { term: 'Minimum departure number', slug: 'minimum-departure', category: 'logistics', definition: 'The minimum number of bookings required for a tour to operate. If the minimum isn\'t met, the operator usually offers a refund or rebooking on a later date.' },
  { term: 'Voucher', slug: 'voucher', category: 'logistics', definition: 'The booking confirmation document presented at tour start — increasingly digital (QR code, PDF) instead of printed. Always carry a backup digital copy in case mobile data fails.' },

  // ---- SAFETY ----
  { term: 'Travel insurance', slug: 'travel-insurance', category: 'safety', definition: 'A policy covering trip cancellation, medical emergencies, and luggage loss while travelling. Not required by most operators but strongly recommended for tours over €500 and any with significant flight components.' },
  { term: 'Tour operator licence', slug: 'tour-operator-licence', category: 'safety', definition: 'A government-issued licence required in many countries (Italy, Greece, Turkey, Egypt) to legally sell tours. Verified agencies on FindToursIn hold their country\'s required licence.' },
  { term: 'Bonded operator', slug: 'bonded-operator', category: 'safety', definition: 'A tour operator that holds financial protection (often in the form of a bond or trust account) to refund travellers if the operator fails. Required in some markets (UK ATOL); voluntary in others.' },
  { term: 'Force majeure', slug: 'force-majeure', category: 'safety', definition: 'A standard contract clause covering events outside the operator\'s control (weather, strikes, civil unrest) that may cancel a tour without standard refund obligations. Travel insurance is the protection against force majeure cancellations.' },
  { term: 'Verified agency', slug: 'verified-agency', category: 'safety', definition: 'On FindToursIn, an agency that has passed identity, licence, and contact-channel checks. The "Verified" badge on a listing indicates the agency was confirmed to legally operate in its country.' },

  // ---- TIPPING / CULTURAL ----
  { term: 'Guide gratuity', slug: 'guide-gratuity', category: 'pricing', definition: 'A tip paid to the tour guide at the end of a tour, customary in most markets. Typical amounts: €5–10 per person for a half-day, €10–20 for a full day, €5–10 per person per day for multi-day tours.' },
  { term: 'Driver gratuity', slug: 'driver-gratuity', category: 'pricing', definition: 'A separate tip for the bus or van driver on tours with transport. Usually half the guide tip — €2–5 for a half-day, €5–10 for a full day.' },

  // ---- DESTINATIONS ----
  { term: 'UNESCO World Heritage Site', slug: 'unesco-site', category: 'planning', definition: 'A cultural or natural site formally recognised by UNESCO for outstanding universal value. There are 1,200+ UNESCO sites worldwide; many tours are built around clusters of them (Greece has 18, Italy has 60).' },
  { term: 'Old Town', slug: 'old-town', category: 'planning', definition: 'The historic core of a European city, usually pedestrianised and dating to before the 19th-century industrial expansion. Old towns are the standard target of city walking tours.' },
  { term: 'Sleeper train', slug: 'sleeper-train', category: 'logistics', definition: 'An overnight train service with private cabins or couchette-style sleeping berths. Common in southern Europe (Italy, Turkey) for crossing long distances overnight as part of a multi-day tour.' },
  { term: 'Ferry hop', slug: 'ferry-hop', category: 'logistics', definition: 'Island-to-island travel by ferry, common in Greece and Croatia. Fast ferries cover 30–60 nautical miles in 90–150 minutes; slow conventional ferries take 4–8 hours but cost half as much.' },
];

export function getGlossaryByCategory(): { category: string; label: string; terms: GlossaryTerm[] }[] {
  const labels: Record<GlossaryTerm['category'], string> = {
    'tour-types': 'Tour types',
    'roles': 'Roles & companies',
    'planning': 'Planning & seasons',
    'pricing': 'Pricing & payment',
    'logistics': 'Logistics & pickup',
    'safety': 'Safety & licensing',
  };
  const order: GlossaryTerm['category'][] = ['tour-types', 'roles', 'planning', 'pricing', 'logistics', 'safety'];
  return order.map((cat) => ({
    category: cat,
    label: labels[cat],
    terms: GLOSSARY.filter((t) => t.category === cat).sort((a, b) => a.term.localeCompare(b.term)),
  }));
}
