import { NextResponse } from 'next/server';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';

/** POST /api/auth/logout — sign out the current user */
export async function POST() {
  if (isDemoMode) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'));
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ success: true });
}
