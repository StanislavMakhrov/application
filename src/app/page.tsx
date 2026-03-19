/**
 * Root page — redirects authenticated users to the energy input page,
 * unauthenticated users to the login page.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/energy');
  }
  redirect('/login');
}
