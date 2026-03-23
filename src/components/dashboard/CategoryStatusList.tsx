'use client';

/**
 * Per-category completion status list for the dashboard.
 * Shows ✓ (erfasst) or ○ (nicht erfasst) for each emission category.
 */

import { CATEGORY_LABELS, CATEGORY_SCOPE } from '@/types';
import type { EmissionCategory } from '@/types';

interface CategoryStatusListProps {
  capturedCategories: Set<string>;
}

const ALL_CATEGORIES: EmissionCategory[] = [
  'ERDGAS', 'HEIZOEL', 'FLUESSIGGAS', 'DIESEL_FUHRPARK', 'BENZIN_FUHRPARK',
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
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            {SCOPE_LABELS[scope]}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {byScope[scope].map((cat) => {
              const captured = capturedCategories.has(cat);
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                    captured ? 'bg-brand-green-pale text-brand-green' : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <span>{captured ? '✓' : '○'}</span>
                  <span>{CATEGORY_LABELS[cat]}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
