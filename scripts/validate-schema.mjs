#!/usr/bin/env node
// Schema validator. Crawls the local dev/preview server, extracts every
// JSON-LD <script type="application/ld+json"> block, and runs cheap
// structural checks on each:
//
//   1. Valid JSON
//   2. @context present (https://schema.org or schema.org)
//   3. @type present
//   4. For known types (Article, Product, FAQPage, BreadcrumbList,
//      DefinedTermSet, ItemList, etc.), required fields are populated
//   5. URL fields are absolute and use the configured site host
//   6. AggregateRating only when verified reviews exist (we never want
//      to ship a fake rating)
//
// Usage:
//   npm run dev    # in another terminal
//   node scripts/validate-schema.mjs               # checks default URL list
//   node scripts/validate-schema.mjs --base http://localhost:4321
//   node scripts/validate-schema.mjs --base https://www.findtoursin.com  # validate prod
//
// Exit code 0 = clean, 1 = errors found. Suitable for CI.

import { argv, exit } from 'node:process';

const argMap = new Map();
for (let i = 2; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    argMap.set(key, value);
  }
}

const BASE = argMap.get('base') || 'http://localhost:4321';
const PROD_HOST = 'www.findtoursin.com';

// Default URLs to validate. Add new templates here when shipping new
// route types so CI catches schema regressions.
const URLS = [
  '/',
  '/tours',
  '/tours/in/greece',
  '/tours/in/greece/santorini',
  '/tours/category/cultural/in/greece',
  '/agencies/aegean-discoveries',
  '/blog',
  '/blog/best-greece-tours-summer-2026',
  '/guide',
  '/guide/glossary',
  '/guide/how-to-choose-a-tour',
  '/best',
  '/best/best-greece-tours',
  '/itineraries',
  '/itineraries/greece/7-days',
  '/compare',
  '/compare/findtoursin-vs-getyourguide',
  '/alternatives/getyourguide-alternatives',
  '/authors/findtoursin-editorial',
  '/about',
  '/about/by-the-numbers',
  '/press',
  '/privacy',
  '/terms',
  '/cookies',
];

const errors = [];
const warnings = [];

function pushErr(url, msg) { errors.push({ url, msg }); }
function pushWarn(url, msg) { warnings.push({ url, msg }); }

const SCHEMA_RE = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

function collectScripts(html) {
  const out = [];
  let m;
  while ((m = SCHEMA_RE.exec(html)) !== null) {
    out.push(m[1]);
  }
  return out;
}

const REQUIRED_BY_TYPE = {
  Article:       ['headline', 'url', 'datePublished'],
  BlogPosting:   ['headline', 'url', 'datePublished'],
  Product:       ['name', 'offers'],
  TouristTrip:   ['name'],
  TravelAgency:  ['name', 'url'],
  TouristAttraction: ['name'],
  TouristDestination: ['name'],
  Place:         ['name'],
  ItemList:      ['itemListElement'],
  FAQPage:       ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
  Organization:  ['name', 'url'],
  Person:        ['name'],
  ProfilePage:   ['mainEntity'],
  CollectionPage: ['name', 'url'],
  WebPage:       ['url'],
  AboutPage:     ['name', 'url'],
  DefinedTermSet: ['name', 'hasDefinedTerm'],
  Trip:          ['name', 'itinerary'],
  ImageObject:   ['contentUrl'],
  VideoObject:   ['name', 'thumbnailUrl', 'contentUrl', 'uploadDate'],
  Dataset:       ['name', 'description'],
};

function validateSchema(url, raw, idx) {
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) {
    pushErr(url, `JSON-LD #${idx}: invalid JSON (${e.message})`);
    return;
  }

  // Many of our scripts use @graph; flatten if present.
  const blocks = parsed['@graph'] ? [parsed, ...parsed['@graph']] : [parsed];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const ctx = block['@context'];
    if (block === parsed && !ctx) {
      pushErr(url, `JSON-LD #${idx}: missing @context`);
    }
    if (ctx && typeof ctx === 'string' && !/schema\.org/.test(ctx)) {
      pushErr(url, `JSON-LD #${idx}: @context is not schema.org (got ${ctx})`);
    }
    const t = block['@type'];
    if (!t) continue; // wrapper without a type is fine when @graph is present
    const types = Array.isArray(t) ? t : [t];
    for (const ty of types) {
      const req = REQUIRED_BY_TYPE[ty];
      if (req) {
        for (const field of req) {
          if (block[field] === undefined || block[field] === null || (Array.isArray(block[field]) && block[field].length === 0)) {
            pushErr(url, `JSON-LD ${ty}: missing required field "${field}"`);
          }
        }
      }
    }

    // URL hygiene: any "url" field should be absolute. On prod, host
    // should match. On dev, allow localhost.
    if (typeof block.url === 'string') {
      try {
        const u = new URL(block.url);
        if (BASE.includes(PROD_HOST) && u.host !== PROD_HOST) {
          pushErr(url, `JSON-LD ${block['@type']}: url has wrong host (${u.host})`);
        }
      } catch {
        pushErr(url, `JSON-LD ${block['@type']}: url is not absolute (${block.url})`);
      }
    }

    // AggregateRating must only fire with reviewCount >= 3 (our white-hat
    // doctrine). Catch anyone wiring it up incorrectly.
    if (block['@type'] === 'Product' && block.aggregateRating) {
      const rc = Number(block.aggregateRating.reviewCount);
      if (!Number.isFinite(rc) || rc < 3) {
        pushErr(url, `JSON-LD Product: aggregateRating present but reviewCount < 3 (got ${rc})`);
      }
    }
  }
}

async function checkUrl(path) {
  const full = `${BASE}${path}`;
  let res;
  try { res = await fetch(full, { redirect: 'manual' }); }
  catch (e) { pushErr(path, `fetch failed: ${e.message}`); return; }
  if (res.status >= 400) {
    pushErr(path, `HTTP ${res.status}`);
    return;
  }
  const html = await res.text();
  const scripts = collectScripts(html);
  if (scripts.length === 0) {
    pushWarn(path, 'no JSON-LD blocks found');
    return;
  }
  scripts.forEach((s, i) => validateSchema(path, s, i + 1));
}

console.log(`Schema validator → ${BASE}`);
console.log(`Checking ${URLS.length} URLs...\n`);

for (const path of URLS) {
  process.stdout.write(`  ${path.padEnd(60)}`);
  // Track per-URL error count to print pass/fail
  const before = errors.length;
  await checkUrl(path);
  const newErrs = errors.length - before;
  if (newErrs === 0) console.log('  PASS');
  else console.log(`  ${newErrs} error(s)`);
}

console.log('');
if (warnings.length > 0) {
  console.log('Warnings:');
  for (const w of warnings) console.log(`  ${w.url}: ${w.msg}`);
  console.log('');
}

if (errors.length > 0) {
  console.log('Errors:');
  for (const e of errors) console.log(`  ${e.url}: ${e.msg}`);
  console.log(`\nFAIL — ${errors.length} schema errors found.`);
  exit(1);
}

console.log(`PASS — ${URLS.length} URLs, all schemas validate cleanly.`);
exit(0);
