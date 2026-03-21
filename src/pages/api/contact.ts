import type { APIRoute } from 'astro';
import { contactMessagesCol, Timestamp } from '../../lib/firestore';

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
      return json({ error: 'Missing required fields' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    const docRef = await contactMessagesCol().add({
      name,
      email,
      subject,
      message,
      isRead: false,
      createdAt: Timestamp.now(),
    });

    return json({ success: true, message: 'Message sent successfully', id: docRef.id }, 201);
  } catch (error) {
    console.error('Error saving contact message:', error);
    return json({ error: 'Failed to send message' }, 500);
  }
};
