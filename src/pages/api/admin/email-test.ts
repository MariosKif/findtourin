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
