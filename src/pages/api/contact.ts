import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { contactMessages } from '../../lib/db/schema';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return json({ error: 'Missing required fields: name, email, subject, message' }, 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    const [contactMessage] = await db
      .insert(contactMessages)
      .values({
        name,
        email,
        subject,
        message,
      })
      .returning();

    return json({ success: true, message: 'Message sent successfully', id: contactMessage.id }, 201);
  } catch (error) {
    console.error('Error saving contact message:', error);
    return json({ error: 'Failed to send message' }, 500);
  }
};
