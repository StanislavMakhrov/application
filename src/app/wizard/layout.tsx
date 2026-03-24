'use client';

/**
 * Wizard layout with side navigation, numbered steps, and gradient progress bar.
 * Shows all 7 screens, marks current/completed steps with visual differentiation.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Leaf } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-brand-green/20 bg-white/90 backdrop-blur-sm px-6 py-3 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-green to-brand-green-light">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-brand-green">GrünBilanz</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Schritt {currentScreen} von {WIZARD_STEPS.length}</span>
            <span className="text-xs font-semibold text-brand-green">{Math.round(progress)}%</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mx-auto max-w-7xl mt-2.5">
          <div className="h-1 w-full rounded-full bg-gray-100">
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #2D6A4F, #52B788)',
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full flex flex-1 gap-0 md:gap-6 px-4 md:px-6 py-6">
        {/* Sidebar navigation */}
        <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0">
          {WIZARD_STEPS.map((step) => {
            const isActive = step.id === currentScreen;
            const isDone = step.id < currentScreen;
            return (
              <Link
                key={step.id}
                href={`/wizard/${step.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-brand-green to-brand-green-light text-white shadow-sm font-medium'
                    : isDone
                    ? 'bg-brand-green-pale text-brand-green hover:bg-brand-green-pale/70'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                )}
              >
                {/* Step number / checkmark badge */}
                <span className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDone
                    ? 'bg-brand-green text-white'
                    : 'bg-gray-200 text-gray-500'
                )}>
                  {isDone ? '✓' : step.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight">{step.label}</p>
                  <p className={cn('text-xs leading-tight truncate mt-0.5', isActive ? 'text-white/70' : 'text-gray-400')}>
                    {step.sublabel}
                  </p>
                </div>
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
