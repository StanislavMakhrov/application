import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';

/**
 * Root page: redirect authenticated users to dashboard, others to login.
 * In demo mode (no Supabase credentials), redirect directly to onboarding.
 */
export default async function Home() {
  // Demo mode: skip auth and go straight to the dashboard
  if (isDemoMode) {
    redirect('/onboarding');
  }

  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      redirect('/onboarding');
    }
  }

  redirect('/login');
}
