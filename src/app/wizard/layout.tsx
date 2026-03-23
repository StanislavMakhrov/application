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
    <div className="min-h-screen bg-warm-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-card-border bg-white/80 backdrop-blur-sm px-6 py-3 shadow-card sticky top-0 z-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-brand-green hover:opacity-80 transition-opacity">
            🌿 GrünBilanz
          </Link>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-3 py-1">
            Schritt {currentScreen} / {WIZARD_STEPS.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mx-auto max-w-7xl mt-3">
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-card-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full flex flex-1 gap-0 md:gap-6 px-4 md:px-6 py-6">
        {/* Sidebar navigation */}
        <nav className="hidden md:flex flex-col gap-1.5 w-52 shrink-0">
          {WIZARD_STEPS.map((step) => {
            const isActive = step.id === currentScreen;
            const isDone = step.id < currentScreen;
            return (
              <Link
                key={step.id}
                href={`/wizard/${step.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                  isActive
                    ? 'bg-gradient-brand text-white shadow-sm font-medium'
                    : isDone
                    ? 'bg-brand-green-muted text-brand-green hover:bg-brand-green-pale border border-brand-green/20'
                    : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'
                )}
              >
                {/* Step circle */}
                <span
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-brand-green text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isDone ? '✓' : step.id}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">{step.label}</span>
                  <span className={cn('text-xs mt-0.5 truncate', isActive ? 'text-white/70' : 'text-gray-400')}>
                    {step.sublabel}
                  </span>
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
