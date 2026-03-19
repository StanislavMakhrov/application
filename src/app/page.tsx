import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * Root page: redirect authenticated users to dashboard, others to login.
 */
export default async function Home() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      redirect('/onboarding');
    }
  }

  redirect('/login');
}
