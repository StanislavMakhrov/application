'use client';

/**
 * Navigation — top navigation bar for authenticated dashboard pages.
 *
 * Shows the GrünBilanz brand, navigation links, and a sign-out button.
 * Marks the active route using Next.js usePathname().
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const NAV_LINKS = [
  { href: '/onboarding', label: 'Unternehmen' },
  { href: '/energy', label: 'Energiedaten' },
  { href: '/reports', label: 'Berichte' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/energy" className="flex items-center gap-2 font-bold text-green-700">
          <span className="text-xl">🌿</span>
          <span>GrünBilanz</span>
        </Link>

        {/* Nav links */}
        <div className="hidden gap-1 sm:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          Abmelden
        </button>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 border-t border-gray-100 px-4 py-2 sm:hidden">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 rounded-md px-2 py-1 text-center text-xs font-medium transition-colors ${
                isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
