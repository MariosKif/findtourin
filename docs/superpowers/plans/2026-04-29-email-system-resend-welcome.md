# Email System (Resend) — Step 1: Welcome Emails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a transactional-email backbone with Resend and use it to send a Welcome email to every newly registered user (one variant for `role=user`, one for `role=agency`). Foundation is reusable for future flows (verify-email, password-reset, plan-activated, payment-receipt).

**Architecture:** A small `src/lib/email/` module owns the Resend SDK client (lazy-initialised the same way the Supabase client is, so Vercel's late env-var population can't catch us out), a typed `sendEmail()` helper, and one file per template (subject + html + plaintext returners). The `/api/auth/register` endpoint calls `sendEmail()` fire-and-forget after the user profile is committed, so a slow Resend call never blocks the registration response. A tiny admin-gated `/api/admin/email-test` endpoint is added so we can sanity-check delivery without registering a fresh user every time.

**Tech Stack:** Astro 6 SSR (Vercel adapter), Resend Node SDK (`resend` npm package), TypeScript.

**Discovery already done (2026-04-29):**
- No email packages installed (`resend`, `nodemailer`, `mailgun`, `postmark` all absent from `package.json`).
- Register endpoint at `src/pages/api/auth/register.ts` creates the auth user → inserts the `users` row → optionally redeems a discount code → signs them in. The natural send-point is right after the profile insert succeeds (so we don't email people whose registration ultimately rolls back).
- Discount-code branch sets `activatedPlan` and `codeFailedReason` — the agency welcome template can mention the activated plan when present.
- `src/lib/supabase.ts` uses a `Proxy`-based lazy client; we'll mirror that pattern for `resend` so importing the email module at module-load time doesn't read empty env vars.
- The brand contact mailbox is `info@findtoursin.com` (unified earlier today across the codebase). Welcome emails should be sent **from** a `noreply@findtoursin.com` address once `findtoursin.com` is verified in the Resend dashboard. Until that's verified, Resend forces `onboarding@resend.dev` as the `from`. The plan accommodates both: an `EMAIL_FROM` env var picks the right value per environment.

**Provided credentials (live key, treat with care):** `RESEND_API_KEY=re_Brj6aPqj_9guA42mRZksyLsEcpVSVud46`. The plan adds it to `.env`, `.env.example`, and the Vercel project env; it is never committed to a tracked file.

---

## File Map

| File | Change |
|---|---|
| `package.json` / `package-lock.json` | Add `resend` dependency. |
| `.env` (untracked) | Add `RESEND_API_KEY` and `EMAIL_FROM`. |
| `.env.example` | Document `RESEND_API_KEY` and `EMAIL_FROM` placeholders. |
| `src/lib/email/resend.ts` | **Create.** Lazy-init Resend client via Proxy. |
| `src/lib/email/send.ts` | **Create.** `sendEmail({ to, template })` typed wrapper, with a `template` discriminated union of the supported templates. Logs on failure but never throws (callers fire-and-forget). |
| `src/lib/email/templates/welcome-user.ts` | **Create.** `buildWelcomeUser({ name }) → { subject, html, text }`. |
| `src/lib/email/templates/welcome-agency.ts` | **Create.** `buildWelcomeAgency({ name, companyName, activatedPlan? }) → { subject, html, text }`. |
| `src/pages/api/auth/register.ts` | Wire the welcome send right before the response. Fire-and-forget. |
| `src/pages/api/admin/email-test.ts` | **Create.** Admin-only POST that triggers an arbitrary template send to a chosen `to` address — for production sanity checks without re-registering. |
| Vercel project env vars | Add `RESEND_API_KEY` (Production + Preview) and `EMAIL_FROM` (Production). User does this in the Vercel UI; the plan documents the exact values to paste. |

---

## Task 1: Install Resend SDK

**Files:**
- Modify: `package.json` (auto via npm)

- [ ] **Step 1: Install**

```bash
npm install resend
```

Expected: a single line added to `package.json` `dependencies` for `resend` (latest 4.x as of 2026-04). Lockfile updated.

- [ ] **Step 2: Confirm the SDK imports cleanly**

```bash
node -e "console.log(require('resend').Resend.name)"
```

Expected: `Resend`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(email): install resend SDK"
```

---

## Task 2: Configure env vars

**Files:**
- Modify: `.env` (uncommitted local file)
- Modify: `.env.example`
- Vercel project (Production + Preview)

The Resend API key is `re_Brj6aPqj_9guA42mRZksyLsEcpVSVud46` (provided by the human). The `from` value must match a verified Resend domain — until `findtoursin.com` is verified in the Resend dashboard, the value `FindToursIn <onboarding@resend.dev>` is forced. After verification, change to `FindToursIn <noreply@findtoursin.com>`.

- [ ] **Step 1: Add to `.env`** (local, untracked)

Append:

```
RESEND_API_KEY=re_Brj6aPqj_9guA42mRZksyLsEcpVSVud46
EMAIL_FROM=FindToursIn <onboarding@resend.dev>
```

- [ ] **Step 2: Add placeholders to `.env.example`**

Append:

```
RESEND_API_KEY=re_xxx
EMAIL_FROM=FindToursIn <onboarding@resend.dev>
```

- [ ] **Step 3: Commit `.env.example`**

```bash
git add .env.example
git commit -m "chore(env): document RESEND_API_KEY + EMAIL_FROM"
```

- [ ] **Step 4: Tell the user what to paste into Vercel**

Surface this verbatim in the final report:

> Vercel → Project (`findtourin`) → Settings → Environment Variables, add:
> - `RESEND_API_KEY` (Production + Preview) = `re_Brj6aPqj_9guA42mRZksyLsEcpVSVud46`
> - `EMAIL_FROM` (Production) = `FindToursIn <onboarding@resend.dev>` for now; switch to `FindToursIn <noreply@findtoursin.com>` once you verify the domain in Resend.

This task does not (and cannot) edit Vercel settings programmatically.

---

## Task 3: Lazy-init Resend client

**Files:**
- Create: `src/lib/email/resend.ts`

Mirror the supabase.ts Proxy pattern so calling `resend.emails.send(...)` at request time always sees the latest `process.env`.

- [ ] **Step 1: Create the file**

```typescript
// src/lib/email/resend.ts
import { Resend } from 'resend';

// Mirror of src/lib/supabase.ts: defer client creation until first property
// access. On the Vercel/@astrojs/vercel runtime, env vars are not always
// populated by the time shared chunks are first imported — and we already
// got bitten by that with the Supabase client. Same fix here.
let _client: Resend | null = null;

function getClient(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY || '';
  if (!key) {
    console.error('FATAL: RESEND_API_KEY is not set on the running function.');
  }
  _client = new Resend(key);
  return _client;
}

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
```

- [ ] **Step 2: Build to confirm TS compiles**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/resend.ts
git commit -m "feat(email): lazy-init Resend client (mirror of supabase Proxy)"
```

---

## Task 4: Welcome-email templates

**Files:**
- Create: `src/lib/email/templates/welcome-user.ts`
- Create: `src/lib/email/templates/welcome-agency.ts`

Templates return `{ subject, html, text }`. The HTML uses minimal inline CSS (no fancy tables — most modern clients render flexbox/divs fine, and we'd rather ship something maintainable now than a 1998-style table layout). Plaintext is generated for clients that prefer it.

- [ ] **Step 1: User template**

Create `src/lib/email/templates/welcome-user.ts`:

```typescript
const SITE = 'https://www.findtoursin.com';

export interface WelcomeUserVars {
  name: string;
}

export function buildWelcomeUser(vars: WelcomeUserVars) {
  const { name } = vars;
  const subject = 'Welcome to FindToursIn';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:32px 32px 16px 32px;">
      <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;">Welcome, ${escape(name)}.</h1>
      <p style="margin:0 0 16px 0;line-height:1.5;color:#374151;">Thanks for joining FindToursIn — your starting point for tours from agencies you can actually book with directly. Travellers contact agencies straight from each listing; we charge zero commission.</p>
      <p style="margin:0 0 24px 0;line-height:1.5;color:#374151;">Here are three good ways to start:</p>
      <ul style="margin:0 0 24px 0;padding:0 0 0 20px;line-height:1.7;color:#374151;">
        <li><a href="${SITE}/tours" style="color:#3a56d4;">Browse all tours</a></li>
        <li><a href="${SITE}/blog" style="color:#3a56d4;">Read travel guides on the blog</a></li>
        <li><a href="${SITE}/" style="color:#3a56d4;">Search by destination</a></li>
      </ul>
      <p style="margin:0 0 8px 0;line-height:1.5;color:#6b7280;font-size:14px;">Questions? Reply to this email or write to <a href="mailto:info@findtoursin.com" style="color:#3a56d4;">info@findtoursin.com</a>.</p>
    </td></tr>
    <tr><td style="padding:16px 32px 32px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;line-height:1.5;">FindToursIn · 0% commission, direct-with-agency tour discovery</td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Welcome, ${name}.`,
    '',
    'Thanks for joining FindToursIn — your starting point for tours from',
    'agencies you can actually book with directly. Travellers contact',
    'agencies straight from each listing; we charge zero commission.',
    '',
    'Get started:',
    `  Browse tours    ${SITE}/tours`,
    `  Read the blog   ${SITE}/blog`,
    `  Search by destination  ${SITE}/`,
    '',
    'Questions? Reply to this email or write to info@findtoursin.com.',
    '',
    '— FindToursIn',
  ].join('\n');

  return { subject, html, text };
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

- [ ] **Step 2: Agency template**

Create `src/lib/email/templates/welcome-agency.ts`:

```typescript
const SITE = 'https://www.findtoursin.com';

export interface WelcomeAgencyVars {
  name: string;
  companyName?: string | null;
  activatedPlan?: string | null;
}

export function buildWelcomeAgency(vars: WelcomeAgencyVars) {
  const { name, companyName, activatedPlan } = vars;
  const display = companyName || name;
  const subject = activatedPlan
    ? `Your ${capitalise(activatedPlan)} plan is active — welcome to FindToursIn`
    : 'Welcome to FindToursIn for agencies';

  const planLine = activatedPlan
    ? `<p style="margin:0 0 16px 0;line-height:1.5;color:#374151;">Your <strong>${escape(capitalise(activatedPlan))}</strong> plan is active. You can start adding tours right away.</p>`
    : `<p style="margin:0 0 16px 0;line-height:1.5;color:#374151;">Pick a plan when you're ready to publish — every plan is 0% commission, flat monthly fee.</p>`;

  const planLineText = activatedPlan
    ? `Your ${capitalise(activatedPlan)} plan is active. You can start adding tours right away.`
    : `Pick a plan when you are ready to publish — every plan is 0% commission, flat monthly fee.`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:32px 32px 16px 32px;">
      <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;">Welcome aboard, ${escape(display)}.</h1>
      <p style="margin:0 0 16px 0;line-height:1.5;color:#374151;">FindToursIn is a 0%-commission directory: travellers find your listings and contact you directly. You keep 100% of every booking.</p>
      ${planLine}
      <p style="margin:0 0 8px 0;line-height:1.5;color:#374151;font-weight:500;">Next steps:</p>
      <ul style="margin:0 0 24px 0;padding:0 0 0 20px;line-height:1.7;color:#374151;">
        <li><a href="${SITE}/dashboard/tours/new" style="color:#3a56d4;">Add your first tour</a></li>
        <li><a href="${SITE}/dashboard/settings" style="color:#3a56d4;">Polish your agency profile</a></li>
        <li><a href="${SITE}/dashboard/pricing" style="color:#3a56d4;">Compare plans &amp; upgrade</a></li>
      </ul>
      <p style="margin:0 0 8px 0;line-height:1.5;color:#6b7280;font-size:14px;">Need a hand? Reply to this email or write to <a href="mailto:info@findtoursin.com" style="color:#3a56d4;">info@findtoursin.com</a>.</p>
    </td></tr>
    <tr><td style="padding:16px 32px 32px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;line-height:1.5;">FindToursIn · 0% commission, direct-with-agency tour discovery</td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Welcome aboard, ${display}.`,
    '',
    'FindToursIn is a 0%-commission directory: travellers find your listings',
    'and contact you directly. You keep 100% of every booking.',
    '',
    planLineText,
    '',
    'Next steps:',
    `  Add your first tour       ${SITE}/dashboard/tours/new`,
    `  Polish your profile       ${SITE}/dashboard/settings`,
    `  Compare plans & upgrade   ${SITE}/dashboard/pricing`,
    '',
    'Need a hand? Reply to this email or write to info@findtoursin.com.',
    '',
    '— FindToursIn',
  ].join('\n');

  return { subject, html, text };
}

function capitalise(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/templates/
git commit -m "feat(email): welcome-user and welcome-agency templates"
```

---

## Task 5: `sendEmail()` helper

**Files:**
- Create: `src/lib/email/send.ts`

A typed entrypoint that the rest of the app calls. Uses a discriminated union so adding a future template is one new case.

- [ ] **Step 1: Create the file**

```typescript
// src/lib/email/send.ts
import { resend } from './resend';
import { buildWelcomeUser, type WelcomeUserVars } from './templates/welcome-user';
import { buildWelcomeAgency, type WelcomeAgencyVars } from './templates/welcome-agency';

type Template =
  | { name: 'welcome-user'; vars: WelcomeUserVars }
  | { name: 'welcome-agency'; vars: WelcomeAgencyVars };

export interface SendEmailInput {
  to: string;
  template: Template;
}

export async function sendEmail({ to, template }: SendEmailInput): Promise<void> {
  const from = process.env.EMAIL_FROM || 'FindToursIn <onboarding@resend.dev>';

  let payload: { subject: string; html: string; text: string };
  switch (template.name) {
    case 'welcome-user':
      payload = buildWelcomeUser(template.vars);
      break;
    case 'welcome-agency':
      payload = buildWelcomeAgency(template.vars);
      break;
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (error) {
      console.error('sendEmail: resend error', { template: template.name, to, error });
      return;
    }
    console.log('sendEmail: sent', { template: template.name, to, id: data?.id });
  } catch (err) {
    console.error('sendEmail: unexpected', { template: template.name, to, err });
  }
}
```

This function never throws. Callers can `void sendEmail(…)` and forget about it.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/send.ts
git commit -m "feat(email): typed sendEmail() helper with template discriminated union"
```

---

## Task 6: Wire welcome emails into the register endpoint

**Files:**
- Modify: `src/pages/api/auth/register.ts`

Send fire-and-forget after the profile insert and the discount-code redemption (so we know whether `activatedPlan` is set before we build the agency body), but before the response. Use `void sendEmail(...).catch(() => {})` so an SDK error never blocks the user.

- [ ] **Step 1: Add the import**

At the top of `src/pages/api/auth/register.ts`, after the existing imports:

```typescript
import { sendEmail } from '../../../lib/email/send';
```

- [ ] **Step 2: Insert the send call**

Find the line near the bottom of the handler that signs the user in:

```typescript
    // Sign in to get session
    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
```

Immediately **before** that line, add:

```typescript
    // Welcome email — fire-and-forget. Resend errors are logged but never
    // block the registration response.
    if ((role || 'user') === 'agency') {
      void sendEmail({
        to: email,
        template: {
          name: 'welcome-agency',
          vars: { name, companyName: companyName || null, activatedPlan },
        },
      });
    } else {
      void sendEmail({
        to: email,
        template: { name: 'welcome-user', vars: { name } },
      });
    }
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/auth/register.ts
git commit -m "feat(auth): send welcome email on registration (fire-and-forget)"
```

---

## Task 7: Admin-gated email-test endpoint

**Files:**
- Create: `src/pages/api/admin/email-test.ts`

Lets the admin trigger a chosen template send to an arbitrary `to` address without registering a fresh user. Useful for after-deploy verification and for previewing template changes.

- [ ] **Step 1: Create the file**

```typescript
// src/pages/api/admin/email-test.ts
//
// Admin-only POST that fires a chosen template at a chosen address. Used
// for after-deploy delivery checks and template previews. Body:
//   { to: string, template: 'welcome-user' | 'welcome-agency', vars?: ... }
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { sendEmail } from '../../../lib/email/send';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const to = String(body.to || '').trim();
  const templateName = body.template as 'welcome-user' | 'welcome-agency' | undefined;
  if (!to || !templateName) return json({ error: 'to and template are required' }, 400);

  if (templateName === 'welcome-user') {
    await sendEmail({
      to,
      template: { name: 'welcome-user', vars: { name: body.vars?.name || 'Test User' } },
    });
  } else if (templateName === 'welcome-agency') {
    await sendEmail({
      to,
      template: {
        name: 'welcome-agency',
        vars: {
          name: body.vars?.name || 'Test Agency',
          companyName: body.vars?.companyName || 'Test Travel Co',
          activatedPlan: body.vars?.activatedPlan || null,
        },
      },
    });
  } else {
    return json({ error: 'Unknown template' }, 400);
  }

  return json({ ok: true });
};
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/email-test.ts
git commit -m "feat(admin): /api/admin/email-test for delivery + template preview"
```

---

## Task 8: Push, verify env in Vercel, smoke

- [ ] **Step 1: Push**

```bash
git push 'https://MariosKif:${GH_PAT}@github.com/MariosKif/findtourin.git' main
```

- [ ] **Step 2: Pause for the human to add Vercel env vars**

Communicate to the human (the user owns Vercel UI access):

> Add the following to Vercel (`Project → Settings → Environment Variables`):
> - `RESEND_API_KEY` = `re_Brj6aPqj_9guA42mRZksyLsEcpVSVud46` (Production + Preview)
> - `EMAIL_FROM` = `FindToursIn <onboarding@resend.dev>` (Production)
>
> Trigger a redeploy (any commit/push will do — the next push of this plan's commits already triggers one).

- [ ] **Step 3: Smoke (after redeploy)**

Run the temp-admin probe pattern. Create `scripts/_smoke-email.mjs`:

```javascript
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('/Users/marios/Desktop/Cursor/worldoftours/.env', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const SITE = 'https://www.findtoursin.com';
const TARGET = 'itdevgr24@gmail.com'; // user's own inbox
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const email = `tmp-email-probe-${Date.now()}@itdev.gr`;
const password = 'TempProbe!' + Math.random().toString(36).slice(2, 10);
const { data: u } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
const id = u.user.id;
await admin.from('users').insert({
  id, email, name: 'Email Probe', role: 'admin',
  phone: null, website: null, company_name: null, company_desc: null,
  avatar_url: null, is_verified: true, stripe_customer_id: null,
});
const { data: s } = await admin.auth.signInWithPassword({ email, password });
const cookie = `sb-access-token=${s.session.access_token}; sb-refresh-token=${s.session.refresh_token}`;

console.log('POST /api/admin/email-test (welcome-user)');
const r1 = await fetch(`${SITE}/api/admin/email-test`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookie },
  body: JSON.stringify({ to: TARGET, template: 'welcome-user', vars: { name: 'Marios' } }),
});
console.log('  status:', r1.status, await r1.text());

console.log('POST /api/admin/email-test (welcome-agency)');
const r2 = await fetch(`${SITE}/api/admin/email-test`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookie },
  body: JSON.stringify({
    to: TARGET, template: 'welcome-agency',
    vars: { name: 'Marios', companyName: 'Probe Travel Co', activatedPlan: 'professional' },
  }),
});
console.log('  status:', r2.status, await r2.text());

await admin.from('users').delete().eq('id', id);
await admin.auth.admin.deleteUser(id).catch(()=>{});
```

Run: `node scripts/_smoke-email.mjs`
Expected:
- Both calls return `{ ok: true }`.
- Two emails arrive at `itdevgr24@gmail.com` within 30 seconds: one user-flavoured ("Welcome, Marios"), one agency-flavoured ("Your Professional plan is active — welcome to FindToursIn").
- Resend dashboard at `resend.com/emails` shows two `delivered` rows.

- [ ] **Step 4: Delete the smoke script**

```bash
rm scripts/_smoke-email.mjs
```

This task does not produce a commit.

---

## Self-Review

**Spec coverage:**
- Resend SDK installed → Task 1 ✅
- API key in env (local + Vercel) → Task 2 ✅
- Lazy-init client (no late-env-var bug) → Task 3 ✅
- One template per role with subject + html + text → Task 4 ✅
- Typed `sendEmail()` helper that the rest of the codebase will use for every future email flow → Task 5 ✅
- Welcome email fires on register, fire-and-forget, never blocks the response → Task 6 ✅
- Sanity-check endpoint so future template tweaks are cheap to verify → Task 7 ✅
- End-to-end production smoke → Task 8 ✅

**Placeholder scan:** No "TBD" / "fill in details" / "similar to Task N" — every code block is the literal code that lands on disk.

**Type/name consistency:**
- `WelcomeUserVars`, `WelcomeAgencyVars` exported from each template, imported into `send.ts` for the discriminated union.
- `sendEmail` argument shape matches the call sites in Task 6 and Task 7.
- `EMAIL_FROM` env var name matches across `.env.example`, the Vercel ask, and `send.ts`.
- `activatedPlan` carried through from the discount-code branch in `register.ts` into `WelcomeAgencyVars`.

**Out-of-scope (deliberately):**
- Domain verification flow (Resend DNS records for findtoursin.com). The plan's `EMAIL_FROM` defaults to `onboarding@resend.dev`, which works on day one. Once the human verifies the domain in Resend, switching `EMAIL_FROM` is a one-line env change.
- Bounce / complaint webhooks. Useful later for list hygiene; not part of step 1.
- React-email or MJML for richer templates. Inline-CSS HTML is enough for the welcome flow.
- Other transactional emails (verify-email, password-reset, payment-receipt, plan-expired, etc.). The `sendEmail()` discriminated union is built so adding each one is one new template file + one new union variant.
