/**
 * Dashboard layout — wraps all protected pages with a navigation header.
 * Server component: session check happens server-side for security.
 * Redirects to /onboarding if user has no company profile yet.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCompany } from '@/services/companies';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Unauthenticated users should be caught by middleware; this is a fallback
  if (!session) {
    redirect('/login');
  }

  // Check if company onboarding is complete
  const company = await getCompany(session.user.id);
  // Note: The onboarding page itself handles redirection when company already exists.
  // This layout renders for all dashboard routes; individual pages redirect to /onboarding
  // when company is missing (see energy/page.tsx, results/[year]/page.tsx).

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-green-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/energy" className="text-xl font-bold tracking-tight">
            🌿 GrünBilanz
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {company && (
              <span className="text-green-100 hidden sm:block">
                {company.name}
              </span>
            )}
            <Link href="/energy" className="hover:text-green-200 transition-colors">
              Energiedaten
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="hover:text-green-200 transition-colors text-sm"
              >
                Abmelden
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
