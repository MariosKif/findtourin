// Topical-authority guides. These are evergreen, long-form pages that
// target high-intent informational queries — the kind LLMs cite when
// answering "how do I X" travel questions. Each guide is editorial-curated,
// not generated. Add new guides here and they appear in /guide/ index +
// sitemap automatically.

export interface GuideSection {
  heading: string;
  /** Plain text or simple markdown. Renders as <p> blocks. */
  body: string;
}

export interface Guide {
  slug: string;
  title: string;
  /** Sub-150-char meta description. */
  description: string;
  /** Short tagline rendered under the H1. */
  tagline: string;
  /** ISO-8601 date the guide was last meaningfully updated. */
  updated: string;
  /** ~5-minute read target — used for the article reading time hint. */
  readingMinutes: number;
  /** Rendered as the lead "key takeaway" passage — the part LLMs lift. */
  keyTakeaway: string;
  /** The body of the guide — H2 + paragraphs. Each section's heading
   *  becomes an H2 in the rendered page. */
  sections: GuideSection[];
  /** 4–6 FAQs that close the guide. Same Speakable wiring as everywhere. */
  faqs: { q: string; a: string }[];
  /** Internal links to suggest at the end of the page. */
  related: { href: string; label: string }[];
  /** Optional category tag, used in the index page filter. */
  category: 'planning' | 'booking' | 'destination' | 'safety' | 'money';
}

export const GUIDES: Guide[] = [

  // ---------------------------------------------------------------
  {
    slug: 'how-to-choose-a-tour',
    title: 'How to choose a tour: a traveller\'s checklist',
    description: 'How to evaluate a tour before booking — group size, what\'s included, the operator behind it, cancellation terms, and the four red flags that signal a tour to skip.',
    tagline: 'A 7-step framework for picking the right guided tour',
    updated: '2026-05-08',
    readingMinutes: 7,
    category: 'booking',
    keyTakeaway: 'The single best predictor of a good tour is whether the operator publishes their group cap, what\'s included, and a real cancellation policy in plain language. If any of those three is vague, walk away — those operators have something to hide.',
    sections: [
      {
        heading: '1. Read the group cap, not the marketing copy',
        body: 'Every operator wants to call their tour "small group". The number that matters is the cap — the maximum group size. Premium small-group tours cap at 10–14; mass-market group tours run 30–50 with a single guide. Group size is the strongest predictor of guide attention and the only number on the page that the operator can\'t spin. If the cap isn\'t published, ask before booking.',
      },
      {
        heading: '2. Look at what\'s included — line by line',
        body: 'On a multi-day tour the headline price can hide hundreds of euros of add-ons. Read the inclusions list and list every meal, every transfer, every entry, every guided session. Three common gaps to watch: airport transfers (often charged separately), evening meals on multi-day tours (frequently excluded), and "skip-the-line" entry which sometimes still requires you to pay the venue fee. A clear inclusions list is a sign of an honest operator.',
      },
      {
        heading: '3. Identify the operator behind the listing',
        body: 'Many tours are sold by resellers who don\'t actually run the tour. The operator is the company that owns the logistics, hires the guide, and bears responsibility if something goes wrong. Operator-direct booking — what FindToursIn supports — is usually 15–25% cheaper than the same tour on a commission-based OTA. If the listing doesn\'t identify the operator clearly, you\'re probably paying a reseller markup.',
      },
      {
        heading: '4. Check the cancellation policy in plain language',
        body: 'A clear cancellation policy lists the exact cut-off dates and refund percentages. "Free cancellation up to 24 hours" is one standard for short tours; multi-day tours often require 30–60 days for a full refund. If the policy is vague — "cancellations subject to operator discretion" — your money is at risk. Pair the policy with travel insurance for any booking over €500.',
      },
      {
        heading: '5. Read the reviews, but read them critically',
        body: 'Look for specifics in reviews — names of guides, names of restaurants, specific dates. Generic 5-star praise ("amazing tour, highly recommend!") is often paid or fabricated. Sort reviews by lowest first: a tour with a 4.7 average and zero detailed 1-star reviews is more suspicious than one with a 4.5 average and a few honest gripes. On FindToursIn, ratings only appear when ≥3 verified post-tour reviews exist — we don\'t round up.',
      },
      {
        heading: '6. Check the operator\'s licence and verification',
        body: 'Many countries (Italy, Greece, Turkey, Egypt) legally require tour operators to hold a licence. A verified-agency badge — like the green check mark on FindToursIn — confirms that licence has been validated. For day tours under €100 this matters less; for multi-day or remote tours, it matters a lot. If something goes wrong, an unlicensed operator has no insurance and no recourse for you.',
      },
      {
        heading: '7. Match the tour to your travel style',
        body: 'A tour that\'s perfect for a couple of architecture nerds will bore a family with kids, and vice versa. Read the itinerary critically: is the daily schedule packed (5+ activities) or breathable (2 anchors plus free time)? Are there long bus transfers? Is the walking pace described? The best operators are honest about who their tour is for ("not suitable for travellers with mobility limitations") rather than promising it works for everyone.',
      },
    ],
    faqs: [
      { q: 'What is the most important factor when choosing a tour?', a: 'The group cap is the single most predictive factor — small-group tours (capped at 10–14) deliver dramatically better guide attention and access than mass-market group tours (30–50). Read the cap before the marketing copy.' },
      { q: 'How do I know if a tour operator is legitimate?', a: 'Look for a licence number, a verified-agency badge, a working phone or email, and a fixed address. Reputable platforms (including FindToursIn) verify these before listing the agency. If you can only contact the operator through a chat window, treat that as a red flag.' },
      { q: 'Should I book a tour through an OTA or directly with the operator?', a: 'For most tours, booking the operator directly saves 15–25% versus an OTA — the OTA\'s commission is built into the price. The exception is one-off bookings where you genuinely value the OTA\'s 24-hour cancellation policy and don\'t want to manage payment with a foreign operator.' },
      { q: 'How far in advance should I book a tour?', a: 'Peak-season small-group tours (June–August in Mediterranean Europe) sell out 8–12 weeks ahead. Shoulder season (April–May, September–October) is bookable 2–4 weeks out. Day trips can usually be booked the day before or even same-day in off-season.' },
      { q: 'What are the warning signs of a bad tour operator?', a: 'Four warnings: vague cancellation policy, no group cap published, no licence number visible, and reviews that are all 5-star with no specifics. If two or more of these apply, find a different operator — there is almost always a better-run alternative for the same destination.' },
    ],
    related: [
      { href: '/guide/tour-vs-self-guided', label: 'Tour vs self-guided' },
      { href: '/guide/booking-tours-safely', label: 'Booking tours safely' },
      { href: '/guide/glossary', label: 'Tour-industry glossary' },
      { href: '/tours', label: 'Browse vetted tours' },
    ],
  },

  // ---------------------------------------------------------------
  {
    slug: 'tour-vs-self-guided',
    title: 'Tour vs self-guided: which is right for your trip?',
    description: 'A guided tour costs 2–4× a self-guided trip — but earns its premium for some travellers and not others. The framework for deciding.',
    tagline: 'When a guide is worth the money — and when it isn\'t',
    updated: '2026-05-08',
    readingMinutes: 6,
    category: 'planning',
    keyTakeaway: 'A guided tour is worth the premium when the destination is logistically complex (Cappadocia, the Greek mainland), the language barrier is high, or specific access (skip-the-line, archaeological sites) saves serious time. Self-guided wins on cost, flexibility, and most major European cities where the historic core is walkable and signage is in English.',
    sections: [
      {
        heading: 'What you actually pay for in a guided tour',
        body: 'A guided tour packages four things: transport, interpretation (the guide\'s knowledge), access (pre-booked entries, skip-the-line, restricted sites), and logistics (someone else dealing with the complications). If you\'d be doing all four anyway — renting a car, reading dense history offline, queueing at the Vatican, planning the next morning every night — a tour can pay for itself in pure time saved. If you\'d skip those steps, you\'re paying for something you didn\'t need.',
      },
      {
        heading: 'When guided makes sense',
        body: 'Guided tours win clearly in five scenarios. (1) Logistical complexity — Cappadocia\'s underground cities, the Greek mainland circuit, multi-island Croatia. (2) Language barriers — Turkey, Albania, rural Greece outside the tourist routes. (3) Access — Vatican Museums, Acropolis at peak season, Pompeii, restricted archaeological zones. (4) Time-poor travel — when you\'ve got 5 days for a country that needs 14. (5) Solo travel where the social dimension matters as much as the sightseeing.',
      },
      {
        heading: 'When self-guided makes sense',
        body: 'Self-guided wins when the destination is well-trodden and well-signposted. Most European city centres (Rome, Florence, Athens, Istanbul) work fine on foot with an audio guide and a pre-booked Vatican / Acropolis ticket — you save €60–100 per person and gain the freedom to spend three hours over coffee instead of being herded back to the bus. Self-guided also wins for repeat visits: if you already know Athens, paying for a beginner tour is wasted money.',
      },
      {
        heading: 'The hybrid approach (often the best answer)',
        body: 'Many travellers get the best result by mixing the two. Do the city days self-guided (Rome, Athens, Istanbul on foot with an audio guide); take a guided day tour for one or two complex destinations (Pompeii, Delphi, Cappadocia\'s Red Tour); and let a multi-day operator handle the country-circuit days where logistics get heavy (a 5-day Greek mainland tour through Delphi, Meteora, and Olympia). You pay 30–50% of a fully-guided trip and keep most of the upside.',
      },
      {
        heading: 'How costs compare',
        body: 'For a 7-day Greek itinerary (Athens + Santorini + Crete), a fully self-guided trip with hotels, ferries, and entries runs €900–1,500 per person. A small-group fully-guided tour runs €2,200–3,500 per person all-in. Hybrid (self-guided cities + a guided day trip to Delphi or Meteora + a guided wine day on Santorini) runs €1,200–1,800 per person — close to self-guided cost with the upside on the days that needed expertise.',
      },
    ],
    faqs: [
      { q: 'Is a guided tour worth the cost?', a: 'A guided tour is worth the premium when the destination is logistically complex (multi-island, multi-country, language-barrier-heavy) or when specific access (skip-the-line, restricted sites) saves significant time. For walkable European city centres, self-guided usually wins on price and flexibility.' },
      { q: 'Can I do a hybrid tour and self-guided trip?', a: 'Yes — the hybrid model is what most experienced travellers use. Spend city days self-guided, then book one or two guided day tours for logistically complex sites (Pompeii, Cappadocia, Meteora) where a guide adds real value.' },
      { q: 'How much can I save by going self-guided?', a: 'Self-guided trips typically run 40–60% the cost of a comparable fully-guided tour. The saving comes from no group transport, no operator margin, and no guide fees — though you pay for it in planning time and missed access.' },
      { q: 'Is self-guided travel safe in Mediterranean Europe?', a: 'Yes — Greece, Italy, Turkey, Croatia, and Albania all have well-developed traveller infrastructure and English signage in major destinations. Self-guided travel is safe and common; the trade-off is the time spent planning, not safety risk.' },
      { q: 'When should solo travellers choose guided over self-guided?', a: 'Solo travellers often choose guided tours partly for the social dimension — meeting other travellers — and partly because group transport eliminates the security overhead of solo logistics in unfamiliar areas. Small-group tours (capped at 12) are the typical solo-friendly format.' },
    ],
    related: [
      { href: '/guide/how-to-choose-a-tour', label: 'How to choose a tour' },
      { href: '/guide/booking-tours-safely', label: 'Booking tours safely' },
      { href: '/tours/in/greece', label: 'Tours in Greece' },
      { href: '/tours/in/italy', label: 'Tours in Italy' },
    ],
  },

  // ---------------------------------------------------------------
  {
    slug: 'booking-tours-safely',
    title: 'Booking tours safely: what to verify before paying',
    description: 'A practical checklist for travellers booking tours abroad — licence checks, payment safety, cancellation policies, travel insurance, and the four scams to recognise.',
    tagline: 'A traveller\'s safety checklist for booking tours',
    updated: '2026-05-08',
    readingMinutes: 7,
    category: 'safety',
    keyTakeaway: 'Three checks protect 95% of bookings: confirm the operator holds the licence required in their country, verify a working contact channel before paying, and use a credit card or platform-protected payment method that lets you dispute the charge if the operator fails to deliver.',
    sections: [
      {
        heading: 'Verify the operator\'s licence',
        body: 'Most Mediterranean countries — Italy, Greece, Turkey, Egypt, Croatia — legally require tour operators to hold a national licence. The licence number is usually printed on the operator\'s website footer. You can verify it on the country\'s tourism ministry site. On FindToursIn, the green "Verified" badge confirms we\'ve checked the licence. For multi-day or remote tours, the licence is your main protection if something goes wrong; for day tours under €100, it matters less.',
      },
      {
        heading: 'Confirm a working contact channel before paying',
        body: 'Send a short email or message before booking: "I\'m considering your [tour name] for [date]; can you confirm availability?" A reply within 24–48 hours from a real human is the cheapest possible due-diligence. If you only get an automated reply or no response at all, find a different operator. Operators that don\'t answer pre-booking enquiries also won\'t answer post-booking problems.',
      },
      {
        heading: 'Use a credit card or platform-protected payment',
        body: 'Pay by credit card whenever possible — credit cards in most countries (US, UK, EU) let you dispute and reverse a charge if the operator fails to deliver. Bank transfer is final and effectively unrecoverable. PayPal sits in between: protection exists but is more limited than a chargeback. For amounts over €500, credit card is the safe default. Avoid wiring large amounts to operators you\'ve never spoken to.',
      },
      {
        heading: 'Read the cancellation policy before paying',
        body: 'A reputable operator publishes the exact cut-off dates and refund percentages — for example "Full refund up to 30 days before departure; 50% from 30 to 14 days; no refund within 14 days." If the policy is vague, ask in writing for the specific dates, and save the reply with the booking. Vague cancellation policies are the most common dispute cause; documented ones almost never go wrong.',
      },
      {
        heading: 'Buy travel insurance for tours over €500',
        body: 'Travel insurance covers the tour cost if you have to cancel for a covered reason (illness, family emergency, certain weather events) and covers medical costs if something happens during the tour. For day tours under €100 it\'s rarely worth the premium. For multi-day tours, all-inclusive packages, or anything with significant flight components, travel insurance pays for itself the first time you need it.',
      },
      {
        heading: 'Know the four common scams',
        body: 'Recognise these patterns. (1) "Guide" who approaches you on arrival at a tourist site and offers a "discount" — usually unlicensed, often a setup for shop kickbacks. (2) Tour-day "extras" not in the original booking — bottled water, "guide tip" added to the bill — refuse politely. (3) Pressure to pay 100% upfront by bank transfer to an unknown account. (4) Fake reviews on a fresh listing with no detail. The single best protection against all four is to book through a verified channel before you arrive in the destination.',
      },
    ],
    faqs: [
      { q: 'How do I verify a tour operator is licensed?', a: 'Most Mediterranean countries require tour operators to hold a national licence with a number printed on their website. You can verify it on the country\'s tourism ministry site. On FindToursIn, the "Verified" badge confirms we\'ve checked the licence already.' },
      { q: 'Is it safe to pay by bank transfer for a tour?', a: 'Bank transfers are effectively unrecoverable if something goes wrong, so they\'re only safe with operators you\'ve already worked with. For first-time bookings, prefer credit card or a platform-protected payment that lets you dispute the charge.' },
      { q: 'Do I need travel insurance for a guided tour?', a: 'For tours over €500 — multi-day tours, packages with flights, premium experiences — travel insurance is strongly recommended. For day tours under €100 the premium usually exceeds the risk. Read the policy for what counts as a covered cancellation reason.' },
      { q: 'What should I do if a tour operator stops responding?', a: 'If an operator goes dark before the tour, contact the platform you booked through immediately for a refund or rebooking, file a chargeback with your credit card, and check whether the operator\'s national licence body has a consumer-complaint channel. Document everything in writing.' },
      { q: 'Are tour scams common in Greece, Italy, or Turkey?', a: 'Outright scams are rare with licensed operators in any of those countries — the regulatory frameworks are robust. The risks are mostly with unlicensed "guides" approaching travellers near major sites, not with pre-booked operators. Book ahead through a verified channel and you avoid 95% of the risk.' },
    ],
    related: [
      { href: '/guide/how-to-choose-a-tour', label: 'How to choose a tour' },
      { href: '/guide/glossary', label: 'Tour-industry glossary' },
      { href: '/about', label: 'How FindToursIn vets agencies' },
      { href: '/tours', label: 'Browse verified tours' },
    ],
  },

  // ---------------------------------------------------------------
  {
    slug: 'tipping-tour-guides',
    title: 'Tipping tour guides: how much, when, and to whom',
    description: 'Concrete tipping guidance for tour guides, drivers, and tour leaders by region and trip length — what locals actually expect, with currency-specific amounts.',
    tagline: 'A regional guide to tipping on guided tours',
    updated: '2026-05-08',
    readingMinutes: 5,
    category: 'money',
    keyTakeaway: 'For most guided tours in Mediterranean Europe, plan €5–10 per person for a half-day tour, €10–20 for a full day, and €5–10 per person per day for multi-day tours. Drivers typically get half the guide tip. Tipping is appreciated but not obligatory — bad service warrants a reduced or skipped tip.',
    sections: [
      {
        heading: 'Day tours: standard amounts',
        body: 'For a half-day group walking tour (3–4 hours), the standard tip is €5–10 per person, given directly to the guide at the end. For a full-day tour (6–10 hours), €10–20 per person is appropriate, depending on group size — small-group tours warrant the higher end because guide attention is greater. Free walking tours are tip-only by design; the standard tip there is €10–20 per person, since that is the guide\'s entire compensation.',
      },
      {
        heading: 'Multi-day tours: per-day amounts',
        body: 'For multi-day group tours, plan €5–10 per person per day for the lead guide, given as a lump sum at the end. For a 7-day tour with a couple, that\'s €70–140 total to the guide. Many operators include a "suggested tip" in their pre-tour briefing — that figure is reasonable and you can pay above or below based on service quality.',
      },
      {
        heading: 'Drivers, tour leaders, and other staff',
        body: 'On tours with a separate bus or van driver, the driver typically gets half the guide tip — €2–5 per person for a day tour, or about half what you tipped the guide. On large multi-day group tours with both a tour leader and local guides at each city, the tour leader gets the per-day tip; the local city guides get a smaller one-time tip (€3–5 per person) at the end of their session.',
      },
      {
        heading: 'Regional variations',
        body: 'In Italy and Spain, tipping tour guides is appreciated but less culturally expected than in Greece or Turkey — round up rather than calculate. In the Balkans (Albania, Bulgaria, Croatia), a tip is more meaningful in local terms; €5 per person for a half-day is generous. In Turkey, tipping in cash (Turkish lira or euros) is common and welcome. In all regions, tipping in the local currency is preferred but euros and US dollars are widely accepted.',
      },
      {
        heading: 'When to tip less — or not at all',
        body: 'A tip is a thank-you for service, not a fee. If the guide was bored, late, or rushing through stops to finish early, you\'re entitled to skip the tip — the operator will hear about it from the no-tip pattern more clearly than from a complaint. Conversely, an exceptional guide who stays late, adapts the tour to your interests, or solves a problem deserves above-standard tipping.',
      },
    ],
    faqs: [
      { q: 'How much should I tip a tour guide on a half-day tour?', a: 'For a half-day group tour (3–4 hours), tip €5–10 per person directly to the guide at the end. Free walking tours are tip-only by design; €10–20 per person is the standard there.' },
      { q: 'How much should I tip a tour guide on a full-day tour?', a: 'Full-day group tours warrant €10–20 per person to the guide, with the higher end appropriate for small-group tours (under 12 people) where guide attention is concentrated.' },
      { q: 'Should I tip a tour driver separately?', a: 'Yes — drivers are typically tipped at half the guide rate, given separately. €2–5 per person for a day tour, or roughly half what you tipped the guide on a longer trip.' },
      { q: 'Is tipping required on guided tours in Europe?', a: 'Tipping is appreciated but not legally required. Operators do not include it in the tour price. Skipping or reducing the tip is acceptable when service was poor; the gesture matters more than the exact amount.' },
      { q: 'What\'s the standard tip on a multi-day group tour?', a: 'Plan €5–10 per person per day for the lead guide on a multi-day group tour. For a couple on a 7-day tour, that\'s €70–140 total, given as a lump sum at the end of the trip.' },
    ],
    related: [
      { href: '/guide/how-to-choose-a-tour', label: 'How to choose a tour' },
      { href: '/guide/glossary', label: 'Tour-industry glossary' },
      { href: '/tours', label: 'Browse all tours' },
    ],
  },

  // ---------------------------------------------------------------
  {
    slug: 'best-time-to-visit-greece',
    title: 'Best time to visit Greece: month-by-month guide',
    description: 'When to travel to Greece for islands, cities, hiking, and tours — month-by-month weather, crowds, prices, and what\'s open.',
    tagline: 'A month-by-month breakdown for tour planners',
    updated: '2026-05-08',
    readingMinutes: 8,
    category: 'destination',
    keyTakeaway: 'May, early June, and September are the sweet spot for most travellers — warm weather, full operator schedules, lighter crowds than peak summer, and prices 20–30% below July–August. April and October are excellent for cities and hiking but limit beach days.',
    sections: [
      {
        heading: 'April–May: shoulder season starts',
        body: 'April warms quickly through the month — by mid-April Athens, the Peloponnese, and Crete are pleasant for sightseeing (18–22°C). The Cycladic islands open most operators by mid-April, though some restaurants and small hotels wait until May. Sea temperatures stay too cold for casual swimming until late May. Prices are the lowest of the season; small-group tours have plenty of availability. Flowers across the mainland (Olympus, Zagori, the Mani peninsula) make this the best window for wildflower hikes.',
      },
      {
        heading: 'June: the sweet spot for most travellers',
        body: 'June delivers reliably warm weather (25–30°C in Athens, 24–28°C on the islands) without July–August\'s heat extremes. Sea temperatures hit comfortable swimming levels by mid-June. Operator schedules are at full capacity but crowds at major sites are still 30–40% below peak. Prices for tours and ferries rise from late May; book by early May for the best small-group availability. The first half of June is consistently the best two weeks of the Greek travel year.',
      },
      {
        heading: 'July–August: peak season',
        body: 'Peak season is hot, busy, and expensive — but the islands run at full energy and every operator schedule is dense. Athens regularly hits 38°C+ which makes the Acropolis brutal at midday; book early-morning (8am) Acropolis tours or evening 7pm departures. The meltemi wind kicks up across the Aegean for most of August, affecting ferries and small-boat tours. Book peak-season small-group tours 8–12 weeks ahead.',
      },
      {
        heading: 'September: the second sweet spot',
        body: 'September is many seasoned Greece travellers\' favourite month. Sea temperatures are at their warmest (24–26°C — warmer than June), Athens cools to 28–32°C, and crowds drop noticeably from the second week. Prices fall from mid-month. Operator schedules stay full through September; many run reduced schedules from early October. For travellers who can\'t miss work-week days but want both warm sea and lighter crowds, the third week of September is the ideal window.',
      },
      {
        heading: 'October: cities and shoulder',
        body: 'October is excellent for Athens, the Peloponnese, mainland circuits, and Cretan hiking. Daytime temperatures stay 22–26°C; sea is still swimmable in the south through mid-October. Many island operators run reduced schedules from early October and shut for winter from late October. October is the best mainland-circuit month — Delphi, Meteora, Olympia all in shoulder weather without summer heat.',
      },
      {
        heading: 'November–March: off-season',
        body: 'Athens, Thessaloniki, and the major mainland sites stay open year-round and offer great value November–March. Most island operators close — Santorini and Mykonos drop to skeleton service. Ski season runs December–March in Parnassos and Pelion (limited tour offerings). Off-season prices on hotels and tours are 50–70% below peak; weather is wet and cool (10–15°C in Athens) but not extreme. For city sightseeing without crowds, November and February are quietly excellent months.',
      },
      {
        heading: 'When to book',
        body: 'For July–August peak weeks, book small-group tours 8–12 weeks ahead. For June and September, 4–6 weeks is usually enough. April–May and October are bookable 1–3 weeks out except over Easter (Greek Easter is the busiest single travel weekend of the spring). Day tours from Athens can usually be booked the day before in shoulder season, even same-day in winter.',
      },
    ],
    faqs: [
      { q: 'What is the best month to visit Greece?', a: 'June and September are the two best months for most Greece travellers — warm weather, full operator schedules, and crowds 30–50% below July and August. Late September into early October is the very best window for travellers who want warm sea plus light crowds.' },
      { q: 'Can you visit Greek islands in October?', a: 'Yes through mid-October on most major islands — Santorini, Crete, Mykonos, Rhodes — though many operators reduce schedules from early October. By late October most small-island operators close for winter; Crete and Rhodes are the longest-running.' },
      { q: 'Is Greece too hot in July and August?', a: 'Athens regularly hits 38°C in July–August, which makes daytime sightseeing tough — early-morning (8am) or evening (7pm) Acropolis tours are strongly recommended. The islands stay 28–32°C and are more bearable thanks to sea breezes, though the meltemi wind affects ferries.' },
      { q: 'What is the cheapest time to visit Greece?', a: 'Off-season (November–March) prices are 50–70% below peak, though many island operators close. Within the active season, late April and early October offer the best price-to-weather ratio — full operator availability with prices 20–30% below peak.' },
      { q: 'When does the Greek tourist season start?', a: 'Major mainland and Cretan operators open in late March; Cycladic islands (Santorini, Mykonos) start most operators by mid-April. Full schedule density across the country runs from mid-May to early October.' },
    ],
    related: [
      { href: '/tours/in/greece', label: 'All tours in Greece' },
      { href: '/tours/in/greece/santorini', label: 'Tours in Santorini' },
      { href: '/tours/in/greece/athens', label: 'Tours in Athens' },
      { href: '/blog/best-greece-tours-summer-2026', label: 'Best Greece tours 2026' },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
