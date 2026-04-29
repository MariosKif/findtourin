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
