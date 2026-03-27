'use client';

/**
 * EmissionFactorsInfo — read-only display for the active FactorSet.
 *
 * Replaces the old EmissionFactorsTableEditable to align with the
 * system-provided factor set concept: factors are no longer user-editable;
 * the system ships a predefined "UBA 2024" set that is used for all calculations.
 *
 * A collapsible detail table lets users inspect the actual factor values
 * without exposing any edit controls.
 */

import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { EmissionFactorRow } from '@/types';

interface Props {
  factorSetName: string;
  factorSetSource: string;
  factorSetYear: number;
  rows: EmissionFactorRow[];
}

export function EmissionFactorsInfo({ factorSetName, factorSetSource, factorSetYear, rows }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-4">
      {/* Primary badge: shows which factor set is active */}
      <div className="flex items-center gap-3 p-3 bg-brand-green-pale rounded-lg border border-brand-green/20">
        <BookOpen className="h-5 w-5 text-brand-green shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">
            Verwendetes Faktorset:{' '}
            <span className="text-brand-green font-semibold">{factorSetName}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Quelle: {factorSetSource} · Jahr {factorSetYear}
          </p>
        </div>
      </div>

      {/* Collapsible detail table — read-only, no edit/delete controls */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        {showDetails ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {showDetails ? 'Details ausblenden' : 'Alle Faktoren anzeigen'}
      </button>

      {showDetails && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-2 pr-3 font-medium text-gray-600">Schlüssel</th>
                <th className="text-left pb-2 pr-3 font-medium text-gray-600">Faktor (kg CO₂e)</th>
                <th className="text-left pb-2 pr-3 font-medium text-gray-600">Einheit</th>
                <th className="text-left pb-2 pr-3 font-medium text-gray-600">Quelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="py-2 pr-3 font-mono text-xs text-gray-700">{row.key}</td>
                  <td className="py-2 pr-3 text-gray-700">{row.factorKg}</td>
                  <td className="py-2 pr-3 text-gray-500">{row.unit}</td>
                  <td className="py-2 pr-3 text-gray-500">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
