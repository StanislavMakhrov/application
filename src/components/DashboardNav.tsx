'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardNavProps {
  demoMode?: boolean;
}

/**
 * Navigation bar for the authenticated dashboard area.
 * Shows links to the main sections of the app.
 */
export function DashboardNav({ demoMode = false }: DashboardNavProps) {
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
            {demoMode && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">
                Demo
              </span>
            )}
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

            {!demoMode && (
              <form action="/api/auth/logout" method="POST" className="ml-2">
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Abmelden
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
