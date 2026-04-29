// src/lib/email/send.ts
import { getResendClient } from './resend';
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

  const client = getResendClient();
  if (!client) {
    // Logged once by getResendClient() per cold start; we silently no-op here
    // so registration / admin-test endpoints don't 500 when the env is missing.
    return;
  }

  try {
    const { data, error } = await client.emails.send({
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
