import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

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

    const { data: msg, error } = await supabase
      .from('contact_messages')
      .insert({ name, email, subject, message })
      .select('id')
      .single();

    if (error) throw error;

    return json({ success: true, message: 'Message sent successfully', id: msg.id }, 201);
  } catch (error) {
    console.error('Error saving contact message:', error);
    return json({ error: 'Failed to send message' }, 500);
  }
};
