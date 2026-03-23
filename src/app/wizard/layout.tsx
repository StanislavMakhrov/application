'use client';

/**
 * Wizard layout with side navigation and progress bar.
 * Shows all 7 screens, marks current screen, and tracks completion.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const WIZARD_STEPS = [
  { id: 1, label: 'Firmenprofil', sublabel: 'Name, Branche, MA' },
  { id: 2, label: 'Heizung', sublabel: 'Erdgas, Heizöl, Flüssiggas' },
  { id: 3, label: 'Fuhrpark', sublabel: 'Diesel, Benzin, Fahrleistung' },
  { id: 4, label: 'Strom & Fernwärme', sublabel: 'kWh, Ökostrom' },
  { id: 5, label: 'Dienstreisen', sublabel: 'Flug, Bahn, Pendler' },
  { id: 6, label: 'Materialien', sublabel: 'Kupfer, Stahl, u.a.' },
  { id: 7, label: 'Abfall', sublabel: 'Restmüll, Bauschutt, u.a.' },
];

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Extract current screen from URL like /wizard/3
  const match = pathname.match(/\/wizard\/(\d+)/);
  const currentScreen = match ? parseInt(match[1], 10) : 1;
  const progress = (currentScreen / WIZARD_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-brand-green hover:opacity-80">
            🌿 GrünBilanz
          </Link>
          <span className="text-sm text-gray-500">
            Schritt {currentScreen} von {WIZARD_STEPS.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mx-auto max-w-7xl mt-2">
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-brand-green transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full flex flex-1 gap-0 md:gap-6 px-4 md:px-6 py-6">
        {/* Sidebar navigation */}
        <nav className="hidden md:flex flex-col gap-1 w-52 shrink-0">
          {WIZARD_STEPS.map((step) => {
            const isActive = step.id === currentScreen;
            const isDone = step.id < currentScreen;
            return (
              <Link
                key={step.id}
                href={`/wizard/${step.id}`}
                className={cn(
                  'flex flex-col rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'border-l-[3px] border-l-[#1B4332] bg-brand-green text-white font-medium pl-[calc(0.75rem-3px)]'
                    : isDone
                    ? 'bg-brand-green-pale text-brand-green hover:bg-brand-green-pale/80'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span className="font-medium">
                  {isDone ? '✓ ' : `${step.id}. `}
                  {step.label}
                </span>
                <span className={cn('text-xs mt-0.5', isActive ? 'text-white/75' : 'text-gray-400')}>
                  {step.sublabel}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
