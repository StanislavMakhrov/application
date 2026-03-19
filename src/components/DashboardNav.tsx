'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigation bar for the authenticated dashboard area.
 * Shows links to the main sections of the app.
 * Logout uses a regular form POST to /api/auth/logout which clears the session cookie.
 */
export function DashboardNav() {
  const pathname = usePathname();

  const links = [
    { href: '/onboarding', label: 'Profil' },
    { href: '/energy', label: 'Energiedaten' },
    { href: `/results/${new Date().getFullYear() - 1}`, label: 'Ergebnisse' },
  ];

  return (
    <nav className="bg-white border-b border-green-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/onboarding" className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-bold text-green-800 text-lg">GrünBilanz</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <form action="/api/auth/logout" method="POST" className="ml-2">
              <button
                type="submit"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
