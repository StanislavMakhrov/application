/**
 * Root page — redirects authenticated users to dashboard, others to login.
 * Server component: redirect logic runs on the server for faster navigation.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/energy');
  } else {
    redirect('/login');
  }
}
