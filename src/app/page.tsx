/**
 * Root page — redirects to /login (unauthenticated) or /energy (authenticated).
 * The middleware handles auth-aware redirects for subsequent navigations;
 * this page handles the initial "/" route.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/energy');
  } else {
    redirect('/login');
  }
}
