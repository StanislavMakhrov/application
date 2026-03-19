'use client';

/**
 * Sign-out button for the dashboard navigation bar.
 *
 * Extracted into a client component so it can call the Supabase client-side
 * signOut method without making the entire dashboard layout a client component.
 */
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
    >
      Abmelden
    </button>
  );
}
