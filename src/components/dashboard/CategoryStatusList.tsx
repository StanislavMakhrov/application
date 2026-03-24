'use client';

/**
 * Per-category completion status list for the dashboard.
 * Shows pill-style badges for each emission category grouped by scope —
 * green (captured) or gray (not yet captured).
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
const SCOPE_COLORS = {
  SCOPE1: 'text-brand-green',
  SCOPE2: 'text-brand-green-light',
  SCOPE3: 'text-gray-400',
};

export function CategoryStatusList({ capturedCategories }: CategoryStatusListProps) {
  const byScope: Record<string, EmissionCategory[]> = { SCOPE1: [], SCOPE2: [], SCOPE3: [] };
  for (const cat of ALL_CATEGORIES) {
    byScope[CATEGORY_SCOPE[cat]].push(cat);
  }

  return (
    <div className="space-y-4">
      {(['SCOPE1', 'SCOPE2', 'SCOPE3'] as const).map((scope) => {
        const cats = byScope[scope];
        const captured = cats.filter((c) => capturedCategories.has(c)).length;
        return (
          <div key={scope}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${SCOPE_COLORS[scope]}`}>
                {SCOPE_LABELS[scope]}
              </p>
              <span className="text-xs text-gray-400">{captured}/{cats.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {cats.map((cat) => {
                const done = capturedCategories.has(cat);
                return (
                  <div
                    key={cat}
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                      done
                        ? 'bg-brand-green-pale text-brand-green font-medium'
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${done ? 'bg-brand-green' : 'bg-gray-300'}`} />
                    <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
