/**
 * Dashboard layout — wraps all authenticated pages.
 *
 * Performs a server-side auth check; unauthenticated users are redirected
 * to /login. The middleware handles this for most navigations, but this
 * layout adds an extra layer for server-rendered pages.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Navigation from '@/components/Navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
