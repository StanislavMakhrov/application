/**
 * Supabase Auth callback handler.
 *
 * Exchanges the one-time OAuth / magic-link code for a session and then
 * redirects the user to the energy input page. This route is registered
 * as the Redirect URL in the Supabase project settings.
 */
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/energy`);
}
