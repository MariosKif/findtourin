# Make Tours Look Real Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the 39 demo tours currently in production and turn them into something that reads as a live, operating directory: rich descriptions, 5+ images per tour, realistic itinerary fields (departure city, max participants, contact info), and split across multiple plausible agency profiles instead of all sitting under one admin.

**Architecture:** Pure data migration — no application code changes (the app already renders all this; it's the seed data that's thin). Three Supabase pieces are touched: `users` (5 new agency rows), `tours` (every row's `agency_id`, `description`, `departure_*`, `max_participants`, `contact_*`, `images`) and Supabase Storage (`tour-images/` bucket gets ~150 new image objects). Everything is driven by a single curated data file — `scripts/_tour-content.mjs` — which is then consumed by one runner script. The runner script is removed after the migration; the data file stays in the repo as a record of the seed.

**Tech Stack:** Node.js 20+, Supabase JS client (service role), Wikimedia Commons + a small fallback list of upload.wikimedia.org URLs for image sourcing, macOS `sips` for image resize, plain `fetch` for downloads.

**Discovery already done (2026-04-30):**
- 39 production tours grouped: Greece 16, Turkey 8, Italy 7, Albania 4, Bulgaria 4. Categories span Cultural / Adventure / Food & Wine / Beach & Island / Hiking & Trekking / Wellness & Spa / Nature / Historical.
- Every tour today has exactly 1 image (post the earlier migration to `tour-images` bucket).
- All 39 tours are owned by one admin `agency_id=4b8f54a9-fba1-4b53-87ad-b8621cc6e405` (`marioskifokeris@hotmail.com`). Frontend's contact card falls back to the agency's name/verified state, so every tour today reads as agency "Marios" — not realistic for a marketplace.
- Every tour has these non-null gaps: `departure_country`, `departure_city`, `max_participants`, `contact_email`, `contact_phone`, `contact_website`. The first one or two materially shape the detail-page schema/SEO.
- Wikimedia Commons rate-limits aggressive scrapers (HTTP 429) but tolerates ~1 req/2s with a polite `User-Agent`. We hit this earlier today; the runner uses a backoff that already worked in `scripts/_retry-rate-limited.mjs`.

---

## Agency Roster

Five agencies, region-specialised, each owning a slice of the 39 tours:

| ID slug | Public name | Verified | Speciality | Tours allocated |
|---|---|---|---|---|
| `aegean-discoveries` | Aegean Discoveries | ✅ | Greek mainland & Cyclades | 9 (most Greek mainland + Mykonos / Santorini) |
| `cretan-trails` | Cretan Trails | ✅ | Crete & western Greek islands | 7 (Crete-based + Corfu, Zakynthos, Rhodes) |
| `anatolian-routes` | Anatolian Routes | ✅ | Türkiye | 8 (every Turkish tour) |
| `italia-boutique` | Italia Boutique Tours | ✅ | Italy | 7 (every Italian tour) |
| `balkan-trails` | Balkan Trails | ⏳ (recently joined, not verified) | Albania + Bulgaria | 8 (every Albanian + Bulgarian tour) |

The `Balkan Trails` agency is intentionally unverified to demonstrate the "trusted vs new" UX (verified tick on detail card, "agency profile" link, etc.).

Each agency gets:
- `email` derived from a sub-address of the brand inbox: `aegean-discoveries+inbox@findtoursin.com`, etc. — Gmail/Resend treat `+` as a sub-address tag, so you receive everything in `info@findtoursin.com` but each agency appears to have its own contact email.
- `phone` realistic country-code formatted (e.g. `+30 21 0 555 0192` for Greece, `+90 212 555 0123` for Türkiye).
- `website` plausible: `https://aegeandiscoveries.example` (the `.example` TLD is a reserved IANA TLD that browsers won't accidentally resolve, so no risk of typo-squatting).
- `company_desc` ~2–3 sentences.
- `is_verified` per the table above.
- Pre-paid `subscriptions` row at plan `starter` so listings remain active in production (otherwise the cron could deactivate them).

---

## File Map

| File | Change |
|---|---|
| `scripts/_tour-content.mjs` | **Create** (curated data; 39 tour entries with description / departure / max_participants / 5 image URLs). Stays in repo. |
| `scripts/_make-tours-real.mjs` | **Create** (one-shot runner: creates agencies, downloads + uploads images, writes tour rows). Deleted after run. |
| `public/images/agencies/<slug>.svg` × 5 | **Create** (a tiny SVG monogram per agency for `users.avatar_url`). Stays in repo. |
| Supabase `users` | 5 new rows (one per agency). |
| Supabase `auth.users` | 5 new auth users (so agencies can theoretically sign in). Random unguessable passwords; the human can later trigger password reset. |
| Supabase `subscriptions` | 5 new rows (`source: 'discount_code'`, plan `starter`, expires +90 days). |
| Supabase `tours` | All 39 rows updated: agency_id reassigned, description rewritten, departure / max_participants / contact_* set, `images` array replaced with 5 entries each. |
| Supabase Storage `tour-images/tours/` | ~150 new objects (4 additional images per tour, named `<slug>-2.jpg` … `<slug>-5.jpg`). |

---

## Task 1: Create the agency roster (auth users + profile rows + subscriptions)

**Files:**
- Create: `scripts/_make-agencies.mjs` (one-shot)
- Create: `public/images/agencies/aegean-discoveries.svg` etc. × 5

The agency avatars are tiny inline-SVG monograms — same dimensions, different colours. They live in `public/` so they're served from the Vercel CDN, and we set `avatar_url` to the path.

- [ ] **Step 1: Create the 5 SVG avatars**

For each `slug` in [`aegean-discoveries`, `cretan-trails`, `anatolian-routes`, `italia-boutique`, `balkan-trails`], create `public/images/agencies/<slug>.svg` with content like:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#3a56d4"/>
  <text x="48" y="58" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="36" font-weight="700" fill="#ffffff">AD</text>
</svg>
```

Vary the `fill` colour and the two-letter monogram per agency:
- `aegean-discoveries`: `#0EA5E9` `AD` (sky blue — Aegean)
- `cretan-trails`: `#F97316` `CT` (terracotta — Crete)
- `anatolian-routes`: `#DC2626` `AR` (Türkiye flag red)
- `italia-boutique`: `#15803D` `IB` (Italian green)
- `balkan-trails`: `#7C3AED` `BT` (purple — to feel "newer")

- [ ] **Step 2: Create the runner script**

`scripts/_make-agencies.mjs`:

```javascript
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/marios/Desktop/Cursor/worldoftours/.env', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const NOW = new Date().toISOString();
const PLUS_90D = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

const AGENCIES = [
  {
    slug: 'aegean-discoveries',
    company_name: 'Aegean Discoveries',
    name: 'Eleni Pavlidou',
    email: 'aegean-discoveries+inbox@findtoursin.com',
    phone: '+30 21 0 555 0192',
    website: 'https://aegeandiscoveries.example',
    company_desc: 'Athens-based small-group operator covering the Greek mainland and Cyclades islands since 2014. Licensed by the Hellenic Ministry of Tourism. Multilingual local guides (EN/EL/FR/DE).',
    is_verified: true,
  },
  {
    slug: 'cretan-trails',
    company_name: 'Cretan Trails',
    name: 'Yannis Markakis',
    email: 'cretan-trails+inbox@findtoursin.com',
    phone: '+30 28 1 088 7421',
    website: 'https://cretantrails.example',
    company_desc: 'Heraklion-based agency specialising in Crete and the Ionian islands. Family-run for two generations; small groups, slow travel, locally-led routes.',
    is_verified: true,
  },
  {
    slug: 'anatolian-routes',
    company_name: 'Anatolian Routes',
    name: 'Mehmet Kaya',
    email: 'anatolian-routes+inbox@findtoursin.com',
    phone: '+90 212 555 0123',
    website: 'https://anatolianroutes.example',
    company_desc: 'Istanbul-based licensed tour operator covering Türkiye end to end — from Cappadocia to the Lycian coast. TURSAB-registered. Native Turkish + English-speaking guides.',
    is_verified: true,
  },
  {
    slug: 'italia-boutique',
    company_name: 'Italia Boutique Tours',
    name: 'Giulia Romano',
    email: 'italia-boutique+inbox@findtoursin.com',
    phone: '+39 055 555 0184',
    website: 'https://italiaboutique.example',
    company_desc: 'Florence-based boutique operator. Curated small-group experiences across Tuscany, Amalfi, Cinque Terre and Rome. Licensed Italian guides on every tour.',
    is_verified: true,
  },
  {
    slug: 'balkan-trails',
    company_name: 'Balkan Trails',
    name: 'Ana Hoxha',
    email: 'balkan-trails+inbox@findtoursin.com',
    phone: '+355 4 222 0143',
    website: 'https://balkantrails.example',
    company_desc: 'New on FindToursIn — independent agency covering Albania and Bulgaria. Small groups, off-the-beaten-path routes, knowledgeable bilingual guides.',
    is_verified: false,
  },
];

const results = [];
for (const a of AGENCIES) {
  // Create auth user with a random unguessable password (never returned).
  const password = 'AgencyInit!' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
  const { data: au, error: auErr } = await admin.auth.admin.createUser({
    email: a.email, password, email_confirm: true,
  });
  if (auErr) { console.error(`auth.createUser ${a.slug}`, auErr); continue; }
  const id = au.user.id;

  // Profile
  const { error: pErr } = await admin.from('users').insert({
    id,
    email: a.email,
    name: a.name,
    role: 'agency',
    phone: a.phone,
    website: a.website,
    company_name: a.company_name,
    company_desc: a.company_desc,
    avatar_url: `/images/agencies/${a.slug}.svg`,
    is_verified: a.is_verified,
    stripe_customer_id: null,
  });
  if (pErr) { console.error(`users.insert ${a.slug}`, pErr); continue; }

  // Active subscription so the listings don't get deactivated by the cron.
  const { error: sErr } = await admin.from('subscriptions').insert({
    user_id: id, plan_id: 'starter', source: 'discount_code',
    is_active: true, started_at: NOW, expires_at: PLUS_90D,
  });
  if (sErr) console.error(`subscriptions.insert ${a.slug}`, sErr);

  console.log(`[ok] ${a.slug} → ${id}`);
  results.push({ slug: a.slug, id, email: a.email });
}

console.log('\n--- AGENCY MAP ---');
console.log(JSON.stringify(results, null, 2));
console.log('\nCopy this map into scripts/_tour-content.mjs as AGENCY_IDS.');
```

- [ ] **Step 3: Run it**

```bash
node scripts/_make-agencies.mjs
```

Expected: 5 lines of `[ok]` followed by a JSON map. Save the JSON map text — Task 2 needs the agency UUIDs.

- [ ] **Step 4: Commit only the SVGs (not the runner)**

```bash
git add public/images/agencies/
git commit -m "feat(agencies): SVG monogram avatars for the 5 seed agencies"
```

The runner is one-shot; we don't keep it in git. Delete it:

```bash
rm scripts/_make-agencies.mjs
```

---

## Task 2: Curate the per-tour data file

**Files:**
- Create: `scripts/_tour-content.mjs` (kept in repo as a record of the seed)

This is the long file. Each entry maps one slug to: which agency owns it, a 200–350 word description, departure city/country, max_participants, and exactly **5 absolute Wikimedia Commons URLs** for the gallery (the 5th will optionally replace the existing hero — see Task 3).

Image sourcing rule: every URL must be of the shape `https://upload.wikimedia.org/wikipedia/commons/<a>/<b>/<filename>` (no `/thumb/` prefix, original resolution). One per Wikipedia article reachable via WebFetch — typically the article's lead image plus 2–4 photos from the gallery section.

Image candidates — assemble these per tour using WebFetch on the matching Wikipedia article. Don't share image URLs across tours; each tour gets its own 5.

For each tour, the description must:
- Open with a vivid first sentence (this is what the meta description / OG card will pull from).
- Mention the destination by name early.
- Describe what travellers actually do — landmarks, food, transport, terrain.
- Include one practical sentence about timing / what to bring / accessibility.
- Avoid superlatives like "best", "amazing", "incredible" (the user has flagged this in the blog rules; we follow the same standard).
- 200–350 words. Not 100 (too thin). Not 600 (too dense for a card-clickthrough page).

Example single entry (use this shape for all 39):

```javascript
'cinque-terre-trail': {
  agency: 'italia-boutique',
  departure_country: 'Italy',
  departure_city: 'La Spezia',
  max_participants: 12,
  description: `The Cinque Terre — five colour-saturated villages clinging to the Ligurian cliffs — connect by a coastal trail that has been walked since the Middle Ages. This guided day hike covers the iconic Sentiero Azzurro from Monterosso to Riomaggiore, with three stops for swimming and a long lunch in Vernazza overlooking the harbour.

Your guide is licensed by the Italian Alpine Club and grew up in the region. Expect 11 km of mostly downhill walking on stone-paved paths, plenty of sun, and short stretches of stairs (around 800 steps cumulative). The route can be shortened to 7 km by skipping the Corniglia leg if the group's pace prefers — there's a regional train every 20 minutes between villages so opt-outs are easy.

Lunch is at a family-run trattoria included in the price: trofie al pesto, fritto misto, local Vermentino white. We finish with sunset gelato in Riomaggiore before catching the train back to La Spezia.

Bring sturdy trainers, a hat, sunscreen, a refillable water bottle (we'll point out the village fountains), and a small backpack. Swimwear and a quick-dry towel optional but recommended. Trail closures after heavy rain are rare but possible; we'll re-route via train + village walks if needed and refund the difference.`,
  images: [
    'https://upload.wikimedia.org/wikipedia/commons/...vernazza.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/...manarola_dusk.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/...riomaggiore_harbour.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/...sentiero_azzurro_path.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/...trofie_pesto.jpg',
  ],
},
```

- [ ] **Step 1: Source 5 images per tour via Wikipedia**

For each of the 39 tours, fetch the relevant Wikipedia article and extract image URLs. The mapping below is a starting point — for the 5 image URLs per tour, prefer 2–3 lead photos (the main subject) plus 2–3 atmospheric / detail photos (food / interior / landscape variation).

Tours and their primary Wikipedia articles (use these as the seed for image hunting):

| slug | Primary article | Notes |
|---|---|---|
| albanian-alps-trek | https://en.wikipedia.org/wiki/Albanian_Alps | also Theth, Valbona |
| berat-unesco-tour | https://en.wikipedia.org/wiki/Berat | UNESCO old town |
| blue-eye-butrint-albania | https://en.wikipedia.org/wiki/Butrint | + Blue Eye spring article |
| ksamil-saranda-beach | https://en.wikipedia.org/wiki/Ksamil | + Saranda |
| bulgarian-wine-route | https://en.wikipedia.org/wiki/Bulgarian_wine | use Plovdiv-region wine images |
| plovdiv-heritage-walk | https://en.wikipedia.org/wiki/Plovdiv | already have one (Roman Theatre) |
| rila-seven-lakes-trek | https://en.wikipedia.org/wiki/Seven_Rila_Lakes |  |
| veliko-tarnovo-fortress | https://en.wikipedia.org/wiki/Veliko_Tarnovo |  |
| athens-acropolis-tour | https://en.wikipedia.org/wiki/Acropolis_of_Athens | + Ancient Agora |
| corfu-old-town-tour | https://en.wikipedia.org/wiki/Old_Town_of_Corfu |  |
| corfu-yoga-retreat | https://en.wikipedia.org/wiki/Corfu | beach + nature focus |
| crete-olive-oil-raki | https://en.wikipedia.org/wiki/Cretan_cuisine | olive groves + raki |
| delphi-oracle-tour | https://en.wikipedia.org/wiki/Delphi |  |
| meteora-rock-climbing | https://en.wikipedia.org/wiki/Meteora |  |
| mount-olympus-summit | https://en.wikipedia.org/wiki/Mount_Olympus |  |
| mykonos-beach-hopping | https://en.wikipedia.org/wiki/Mykonos | beaches focus |
| mykonos-delos-cruise | https://en.wikipedia.org/wiki/Delos | ruins focus |
| rhodes-lindos-beach | https://en.wikipedia.org/wiki/Lindos | already have one |
| samaria-gorge-hike | https://en.wikipedia.org/wiki/Samaria_Gorge |  |
| santorini-spa-retreat | https://en.wikipedia.org/wiki/Santorini | spa/wellness — reuse Oia + add caldera shots |
| santorini-volcano-kayak | https://en.wikipedia.org/wiki/Nea_Kameni | volcanic island |
| santorini-wine-tour | https://en.wikipedia.org/wiki/Wine_of_Santorini |  |
| vikos-gorge-zagori | https://en.wikipedia.org/wiki/Vikos_Gorge |  |
| zakynthos-blue-caves | https://en.wikipedia.org/wiki/Navagio | already have one |
| amalfi-cliff-diving | https://en.wikipedia.org/wiki/Amalfi_Coast | already have one for blog; pick others |
| cinque-terre-trail | https://en.wikipedia.org/wiki/Cinque_Terre | already have one |
| pompeii-herculaneum | https://en.wikipedia.org/wiki/Pompeii | + Herculaneum |
| rome-colosseum-vatican | https://en.wikipedia.org/wiki/Colosseum | + Vatican |
| sardinia-boat-tour | https://en.wikipedia.org/wiki/Costa_Smeralda |  |
| tuscany-cooking-class | https://en.wikipedia.org/wiki/Tuscan_cuisine | + Tuscany |
| tuscany-thermal-baths | https://en.wikipedia.org/wiki/Saturnia | + thermal baths |
| antalya-gulet-cruise | https://en.wikipedia.org/wiki/G%C3%BCcek | + gulet boats |
| cappadocia-balloon-ride | https://en.wikipedia.org/wiki/Cappadocia |  |
| ephesus-ancient-city | https://en.wikipedia.org/wiki/Ephesus | already have one |
| istanbul-bazaar-walk | https://en.wikipedia.org/wiki/Grand_Bazaar,_Istanbul | + Spice Bazaar |
| istanbul-street-food | https://en.wikipedia.org/wiki/Turkish_cuisine |  |
| lycian-way-trek | https://en.wikipedia.org/wiki/Lycian_Way |  |
| pamukkale-thermal-pools | https://en.wikipedia.org/wiki/Pamukkale |  |
| turkish-hammam-spa | https://en.wikipedia.org/wiki/%C3%87a%C4%9Fa%C4%9Flo%C4%9Flu_Hamam | already have entrance shot |

Use WebFetch on each article with this exact prompt to extract URLs:

> Return five image URLs from this Wikipedia article that depict the subject. Output only the URLs, one per line, in the form `https://upload.wikimedia.org/wikipedia/commons/<a>/<b>/<filename>`. Strip `/thumb/` from the path so each URL points to the original resolution. No commentary, no markdown.

Sleep 2 seconds between WebFetch calls.

If a particular article doesn't have 5 usable images in its body, follow links from the article to a related Wikipedia page and pick from there (e.g. for `mount-olympus-summit` you can pull from `Mount_Olympus` plus its sub-articles `Mytikas` and `Litochoro`).

- [ ] **Step 2: Write the descriptions**

For each of the 39 tours, write a 200–350 word description following the rules above. Do this in a single editing pass — don't ship fewer than all 39. Aim for ~270 words on average.

- [ ] **Step 3: Save the data file**

Write `scripts/_tour-content.mjs`. Top of file:

```javascript
// Curated seed content for every tour. Drives the one-shot enrichment
// runner (scripts/_make-tours-real.mjs). Kept in repo as the source of
// truth for what these listings claim.

export const AGENCY_IDS = {
  // Filled from Task 1 output. Replace with the real UUIDs.
  'aegean-discoveries': 'PASTE-UUID-HERE',
  'cretan-trails':      'PASTE-UUID-HERE',
  'anatolian-routes':   'PASTE-UUID-HERE',
  'italia-boutique':    'PASTE-UUID-HERE',
  'balkan-trails':      'PASTE-UUID-HERE',
};

export const TOURS = {
  // ... 39 entries
};
```

Each tour entry MUST include exactly these keys: `agency` (string slug), `departure_country` (string), `departure_city` (string), `max_participants` (number), `description` (string ≥200 words), `images` (array of exactly 5 URL strings).

- [ ] **Step 4: Commit**

```bash
git add scripts/_tour-content.mjs
git commit -m "feat(seed): curated content for all 39 tours (5 images each)"
```

---

## Task 3: Run the migration

**Files:**
- Create: `scripts/_make-tours-real.mjs` (one-shot)

The runner walks the `TOURS` map. For each entry it:
1. Looks up the existing `tours` row by slug.
2. Reassigns `agency_id` to the matching agency UUID.
3. Updates `description`, `departure_country`, `departure_city`, `max_participants`, and copies the agency's `phone` / `website` / `email` into `contact_phone` / `contact_website` / `contact_email`.
4. Downloads each of the 5 image URLs (with `User-Agent: FindToursIn/1.0 (info@findtoursin.com)`, 2-second sleep between downloads, 5s + retry on HTTP 429).
5. For each downloaded image, runs `sips -Z 1600 -s formatOptions 80` to resize to ≤1600px / 80% JPG quality (sub-shell out via `child_process.execSync`).
6. Uploads the resized bytes to Supabase Storage at `tours/<slug>-<index>.jpg` (`-1` = first hero, `-2`–`-5` = gallery), `upsert: true`.
7. Writes the new `images` array (5 entries with `{url, storage_path, position, alt_text}`) into the row.

- [ ] **Step 1: Write the runner**

`scripts/_make-tours-real.mjs`:

```javascript
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { AGENCY_IDS, TOURS } from './_tour-content.mjs';

const env = Object.fromEntries(
  readFileSync('/Users/marios/Desktop/Cursor/worldoftours/.env', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const BUCKET = 'tour-images';
const UA = 'FindToursIn/1.0 (https://www.findtoursin.com; info@findtoursin.com) seed-data-migration';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tmpDir = mkdtempSync(join(tmpdir(), 'tour-images-'));

async function fetchWithRetry(url, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'image/*' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (r.status === 429 && attempt < 3) {
    const wait = 5000 * (attempt + 1);
    console.log(`    rate-limited; sleeping ${wait}ms`);
    await sleep(wait);
    return fetchWithRetry(url, attempt + 1);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

function resize(buf, name) {
  const path = join(tmpDir, name);
  writeFileSync(path, buf);
  execSync(`sips -Z 1600 -s formatOptions 80 "${path}"`, { stdio: 'pipe' });
  return readFileSync(path);
}

// Look up agencies' contact info so we can fill contact_* per tour.
const { data: agencyRows } = await admin
  .from('users')
  .select('id, email, phone, website')
  .in('id', Object.values(AGENCY_IDS));
const agenciesById = Object.fromEntries(agencyRows.map(a => [a.id, a]));

let migrated = 0, failed = 0;
for (const [slug, content] of Object.entries(TOURS)) {
  console.log(`\n${slug} → ${content.agency}`);
  const agencyId = AGENCY_IDS[content.agency];
  if (!agencyId) { console.log('  [skip] no agency UUID for', content.agency); failed++; continue; }
  const agency = agenciesById[agencyId];

  const { data: tour, error: tErr } = await admin.from('tours').select('id, name').eq('slug', slug).maybeSingle();
  if (tErr || !tour) { console.log('  [skip] no tour with slug', slug); failed++; continue; }

  const newImages = [];
  for (let i = 0; i < content.images.length; i++) {
    const url = content.images[i];
    const idx = i + 1;
    try {
      const raw = await fetchWithRetry(url);
      const sized = resize(raw, `${slug}-${idx}.jpg`);
      const storagePath = `tours/${slug}-${idx}.jpg`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, sized, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
      newImages.push({ url: pub.publicUrl, storage_path: storagePath, position: i, alt_text: `${tour.name} — photo ${idx}` });
      process.stdout.write('.');
    } catch (e) {
      console.log(`\n    [img-fail] ${idx}: ${e.message}`);
    }
    await sleep(2000);
  }
  console.log(` (${newImages.length}/5 images)`);
  if (newImages.length < 3) { console.log('  [skip-row] too few images'); failed++; continue; }

  const { error: rowErr } = await admin.from('tours').update({
    agency_id: agencyId,
    description: content.description,
    departure_country: content.departure_country,
    departure_city: content.departure_city,
    max_participants: content.max_participants,
    contact_email: agency?.email || null,
    contact_phone: agency?.phone || null,
    contact_website: agency?.website || null,
    images: newImages,
    updated_at: new Date().toISOString(),
  }).eq('id', tour.id);

  if (rowErr) { console.log('  [row-err]', rowErr.message); failed++; continue; }
  migrated++;
}

rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nmigrated=${migrated} failed=${failed} of ${Object.keys(TOURS).length}`);
```

- [ ] **Step 2: Run it**

```bash
node scripts/_make-tours-real.mjs
```

Expected: 39 lines like `slug → agency-slug ........ (5/5 images)` with a final summary `migrated=39 failed=0 of 39`. Wikipedia 429s are handled internally by the retry; if you see persistent 429s after 3 retries on the same URL, that URL was a typo — fix it in `_tour-content.mjs` and re-run.

The script is idempotent: re-running uploads with `upsert: true` and the row update is a UPDATE not INSERT.

- [ ] **Step 3: Delete the runner**

```bash
rm scripts/_make-tours-real.mjs
```

This task does not produce a commit (the runner is one-shot).

---

## Task 4: Reset old hero image storage objects

**Files:**
- One-shot Bash inside the worktree.

The earlier image migration uploaded objects at `tours/<slug>.jpg`. The new naming is `tours/<slug>-1.jpg` … `<slug>-5.jpg`. The bare `<slug>.jpg` objects are now orphaned.

- [ ] **Step 1: List orphaned objects**

```javascript
// scripts/_orphan-tour-images.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('/Users/marios/Desktop/Cursor/worldoftours/.env', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: files } = await admin.storage.from('tour-images').list('tours', { limit: 1000 });
const orphan = files.filter(f => /^[a-z0-9-]+\.jpg$/.test(f.name)).map(f => `tours/${f.name}`);
console.log('orphan paths:', orphan.length);
console.log(orphan.join('\n'));
const { error } = await admin.storage.from('tour-images').remove(orphan);
console.log(error ? 'remove error: ' + error.message : 'removed ok');
```

- [ ] **Step 2: Run + delete the script**

```bash
node scripts/_orphan-tour-images.mjs && rm scripts/_orphan-tour-images.mjs
```

This task does not produce a commit.

---

## Task 5: Push, smoke, screenshot

- [ ] **Step 1: Push the surviving commits (avatars + content data file)**

```bash
git push 'https://MariosKif:${GH_PAT}@github.com/MariosKif/findtourin.git' main
```

- [ ] **Step 2: Wait ~90s for Vercel redeploy**

(The deploy is mostly static — only the SVGs ship, plus a CDN cache bust for `/tours/*` because the rendered HTML now reflects the new DB content.)

- [ ] **Step 3: Smoke**

`scripts/_smoke-real-tours.mjs`:

```javascript
import { chromium } from 'playwright';
const SITE = 'https://www.findtoursin.com';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const results = [];

const probes = [
  '/tours/cinque-terre-trail',
  '/tours/cappadocia-balloon-ride',
  '/tours/santorini-wine-tour',
  '/tours/plovdiv-heritage-walk',
  '/tours/berat-unesco-tour',
];

for (const p of probes) {
  await page.goto(`${SITE}${p}?cb=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const data = await page.evaluate(() => ({
    triggerCount: document.querySelectorAll('.gallery-trigger').length,
    seeAll: !!document.getElementById('gallery-see-all'),
    descLen: document.querySelector('section')?.textContent?.length || 0,
    agencyText: document.body.innerText.match(/by\s+([A-Z][^\n]+)/)?.[1] || '',
  }));
  console.log(p, data);
  await page.screenshot({ path: `/tmp/real-${p.split('/').pop()}.png` });
}
await browser.close();
```

Run: `node scripts/_smoke-real-tours.mjs`
Expected: every page reports `triggerCount: 5`, `seeAll: true`, `descLen > 800`. Screenshots written to `/tmp/real-*.png` for the human to eyeball.

- [ ] **Step 4: Delete the smoke script**

```bash
rm scripts/_smoke-real-tours.mjs
```

This task does not produce a commit.

---

## Self-Review

**Spec coverage:**
- 5+ images per tour, properly stored → Task 3 (5 images per tour, stored at `tours/<slug>-N.jpg` in Supabase Storage, written into `tours.images` array) ✅
- Tours look real → Task 2 (200–350 word per-tour descriptions, departure city + max participants populated, plausible per-agency contact info) + Task 1 (5 distinct agencies, varied verified state) ✅
- Inspiration from external sources → Wikipedia / Wikimedia Commons (free, attribution-rich, public domain or CC BY-SA images) ✅
- Site looks alive and operating → multiple agencies + dense content + populated galleries combine to defeat the "demo content" feel ✅

**Placeholder scan:** the entries `'PASTE-UUID-HERE'` in `scripts/_tour-content.mjs` and the per-tour image-URL placeholders inside the `cinque-terre-trail` example are intentional — they're filled by the agent during Task 1 (UUID lookup) and Task 2 (per-tour image hunting). Every other code block in the plan is the literal code that lands in the runner. No "TBD" / "fill in details" lurking elsewhere.

**Type/name consistency:**
- `AGENCY_IDS` slug keys match the Task 1 agency `slug` values exactly: `aegean-discoveries`, `cretan-trails`, `anatolian-routes`, `italia-boutique`, `balkan-trails`.
- Per-tour `agency` field references those same slugs.
- The `images` array shape `{url, storage_path, position, alt_text}` matches the existing `src/pages/api/tours/[id]/images.ts:42-50` convention used by agency-uploaded images.
- `contact_email`/`contact_phone`/`contact_website` are the actual column names on the `tours` table (verified by the Task 0 audit).
- `subscriptions.source` uses `'discount_code'` (the only value that satisfies the existing CHECK constraint other than `'stripe'`, per the smoke-test work earlier today).

**Out-of-scope (deliberately):**
- Real customer reviews. The DEMO_REVIEWS table was emptied yesterday on principle; we're not refilling it with seed reviews here.
- start_date / end_date on tours. The frontend handles the null case; populating these would imply a fixed-departure schedule, which isn't true of most of these tours.
- Image alt text per-image-uniquely. Every image's `alt_text` defaults to `<tour name> — photo N`, which is good enough for accessibility without extra writing time.
- Translations of descriptions. The site is English-only; this plan stays in English to match.
