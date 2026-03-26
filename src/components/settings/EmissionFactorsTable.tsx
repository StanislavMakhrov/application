/**
 * EmissionFactorsTable — server component for the Settings page.
 *
 * Renders a read-only reference table of all active emission factors,
 * grouped by scope (Scope 1, Scope 2, Scope 3) and sorted alphabetically
 * within each group. Data is pre-fetched by the Settings page Server Component
 * via getAllEmissionFactorRecords() — no fetching inside this component.
 *
 * Negative factors (e.g. ABFALL_ALTMETALL recycling credits) are shown in
 * green with a ♻ prefix.
 */

import React from 'react';
import type { FactorRecord } from '@/types';
import { CATEGORY_LABELS, CATEGORY_SCOPE } from '@/types';

interface EmissionFactorsTableProps {
  factors: Record<string, FactorRecord>;
  year: number;
}

/** Scope ordering for display: Scope 1 first, then 2, then 3, then Other */
const SCOPE_ORDER: Array<string> = ['SCOPE1', 'SCOPE2', 'SCOPE3'];

const SCOPE_LABELS: Record<string, string> = {
  SCOPE1: 'Scope 1 — Direkte Emissionen',
  SCOPE2: 'Scope 2 — Eingekaufte Energie',
  SCOPE3: 'Scope 3 — Vorgelagerte Emissionen',
  OTHER: 'Sonstige',
};

/**
 * Returns the human-readable German label for a factor key.
 * Falls back to the raw key if not found in CATEGORY_LABELS.
 */
function getLabel(key: string): string {
  if (key in CATEGORY_LABELS) {
    return CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS];
  }
  // Material and special keys not in CATEGORY_LABELS — fall back to raw key
  return key;
}

/**
 * Returns the scope for a factor key. Material and Ökostrom keys that are
 * not in CATEGORY_SCOPE are treated as 'SCOPE3'.
 */
function getScope(key: string): string {
  if (key in CATEGORY_SCOPE) {
    return CATEGORY_SCOPE[key as keyof typeof CATEGORY_SCOPE];
  }
  // Special keys (e.g. STROM_OEKOSTROM, material keys) default to SCOPE3
  if (key === 'STROM_OEKOSTROM') return 'SCOPE2';
  return 'SCOPE3';
}

/**
 * Formats a factor value for display using de-DE locale with 3 decimal places.
 * Uses absolute value — sign is communicated via ♻ prefix for negative factors.
 */
function formatFactor(value: number): string {
  return Math.abs(value).toLocaleString('de-DE', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function EmissionFactorsTable({ factors, year }: EmissionFactorsTableProps) {
  if (Object.keys(factors).length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Keine Emissionsfaktoren für {year} gefunden.
      </p>
    );
  }

  // Group keys by scope, with alphabetical sorting within each group
  const grouped: Record<string, string[]> = {};
  for (const key of Object.keys(factors)) {
    const scope = getScope(key);
    if (!grouped[scope]) grouped[scope] = [];
    grouped[scope].push(key);
  }
  for (const scope of Object.keys(grouped)) {
    grouped[scope].sort((a, b) => getLabel(a).localeCompare(getLabel(b), 'de'));
  }

  // Build ordered list of scopes that have entries
  const scopesInOrder = [
    ...SCOPE_ORDER.filter((s) => grouped[s]?.length > 0),
    ...Object.keys(grouped).filter((s) => !SCOPE_ORDER.includes(s) && grouped[s]?.length > 0),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left pb-2 pr-4 font-medium text-gray-600">Kategorie</th>
            <th className="text-left pb-2 pr-4 font-medium text-gray-600">Faktor</th>
            <th className="text-left pb-2 pr-4 font-medium text-gray-600">Quelle</th>
            <th className="text-left pb-2 font-medium text-gray-600">Jahr</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {scopesInOrder.map((scope) => (
            <React.Fragment key={`group-${scope}`}>
              {/* Scope group header row */}
              <tr className="bg-gray-50">
                <td
                  colSpan={4}
                  className="py-1.5 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {SCOPE_LABELS[scope] ?? scope}
                </td>
              </tr>
              {grouped[scope].map((key) => {
                const record = factors[key];
                const isNegative = record.factorKg < 0;
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-700">{getLabel(key)}</td>
                    <td className={`py-2 pr-4 font-mono ${isNegative ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                      {isNegative && '♻ −'}
                      {formatFactor(record.factorKg)} kg CO₂e/{record.unit}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{record.source}</td>
                    <td className="py-2 text-gray-500">{record.validYear}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
