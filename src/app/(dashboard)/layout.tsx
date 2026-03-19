/**
 * Dashboard layout — wraps all protected pages.
 *
 * Verifies authentication on the server before rendering. Unauthenticated
 * requests are redirected to the login page.
 *
 * Renders a top navigation bar with links to the main sections and a sign-out
 * button. Navigation is kept minimal for the MVP.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

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
      {/* Top navigation bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link href="/energy" className="text-xl font-bold text-green-800">
              🌱 GrünBilanz
            </Link>

            {/* Navigation links */}
            <div className="flex items-center gap-6">
              <Link
                href="/energy"
                className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
              >
                Energiedaten
              </Link>
              <Link
                href={`/results/${new Date().getFullYear()}`}
                className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
              >
                Ergebnisse
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
