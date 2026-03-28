import { supabase } from './supabase';
import type { AstroCookies } from 'astro';
import type { User } from '../types';

interface AuthContext {
  request: Request;
  cookies: AstroCookies;
}

export async function getAuthenticatedUser(context: AuthContext): Promise<User | null> {
  const accessToken = context.cookies.get('sb-access-token')?.value;
  if (!accessToken) return null;

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);
    if (error || !authUser) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    return profile;
  } catch {
    return null;
  }
}
