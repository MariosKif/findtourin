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
<head><meta charset="utf-8"><title>${escape(subject)}</title></head>
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
