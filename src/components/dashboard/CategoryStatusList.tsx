'use client';

/**
 * Per-category completion status list for the dashboard.
 * Shows ✓ erfasst (green) or ○ nicht erfasst (gray) for each emission category.
 * Kältemittel categories are also included in the Scope 1 section.
 */

import { CATEGORY_LABELS, CATEGORY_SCOPE } from '@/types';
import type { EmissionCategory } from '@/types';

interface CategoryStatusListProps {
  capturedCategories: Set<string>;
}

const ALL_CATEGORIES: EmissionCategory[] = [
  'ERDGAS', 'HEIZOEL', 'FLUESSIGGAS',
  'R410A_KAELTEMITTEL', 'R32_KAELTEMITTEL', 'R134A_KAELTEMITTEL', 'SONSTIGE_KAELTEMITTEL',
  'DIESEL_FUHRPARK', 'BENZIN_FUHRPARK',
  'PKW_BENZIN_KM', 'PKW_DIESEL_KM', 'TRANSPORTER_KM', 'LKW_KM',
  'STROM', 'FERNWAERME',
  'GESCHAEFTSREISEN_FLUG', 'GESCHAEFTSREISEN_BAHN', 'PENDLERVERKEHR',
  'ABFALL_RESTMUELL', 'ABFALL_BAUSCHUTT', 'ABFALL_ALTMETALL', 'ABFALL_SONSTIGES',
];

const SCOPE_LABELS = { SCOPE1: 'Scope 1', SCOPE2: 'Scope 2', SCOPE3: 'Scope 3' };

export function CategoryStatusList({ capturedCategories }: CategoryStatusListProps) {
  const byScope: Record<string, EmissionCategory[]> = { SCOPE1: [], SCOPE2: [], SCOPE3: [] };
  for (const cat of ALL_CATEGORIES) {
    byScope[CATEGORY_SCOPE[cat]].push(cat);
  }

  return (
    <div className="space-y-4">
      {(['SCOPE1', 'SCOPE2', 'SCOPE3'] as const).map((scope) => (
        <div key={scope}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            {SCOPE_LABELS[scope]}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {byScope[scope].map((cat) => {
              const captured = capturedCategories.has(cat);
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    captured
                      ? 'bg-brand-green-muted text-brand-green border border-brand-green/20'
                      : 'bg-gray-50 text-gray-400 border border-transparent'
                  }`}
                >
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    captured ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {captured ? '✓' : '○'}
                  </span>
                  <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
