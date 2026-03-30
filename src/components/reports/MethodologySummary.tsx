'use client';

/**
 * MethodologySummary — collapsible methodology block for the dashboard.
 *
 * Collapsed (default): shows a one-line headline with the calculation standard,
 * factor source, and included scopes.
 *
 * Expanded: shows the full breakdown table (factors with source badges),
 * input-method counts, and assumptions/exclusions text.
 *
 * Data is fetched from /api/methodology?yearId={yearId} on mount.
 * This keeps the server component (page.tsx) clean — no additional
 * server-side data fetching is required for the methodology block.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MethodologyData } from '@/lib/methodology';

const SCOPE_DISPLAY: Record<string, string> = {
  SCOPE1: 'Scope 1',
  SCOPE2: 'Scope 2',
  SCOPE3: 'Scope 3',
};

interface MethodologySummaryProps {
  yearId: number;
}

export function MethodologySummary({ yearId }: MethodologySummaryProps) {
  const [data, setData] = useState<MethodologyData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/methodology?yearId=${yearId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Fehler'))))
      .then((d: MethodologyData) => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [yearId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-card border border-card-border shadow-card p-4">
        <p className="text-sm text-gray-400 animate-pulse">Methodik wird geladen…</p>
      </div>
    );
  }

  if (!data) return null;

  const scopesLabel = data.includedScopes.map((s) => SCOPE_DISPLAY[s] ?? s).join(' / ');
  const headline = `${data.standard} · ${data.factorSourceLabel}${scopesLabel ? ` · ${scopesLabel}` : ''}`;

  return (
    <div className="bg-white rounded-card border border-card-border shadow-card">
      {/* Toggle row */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors rounded-card"
        aria-expanded={isExpanded}
      >
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Methodik
          </span>
          <p className="text-sm text-gray-700 mt-0.5">{headline}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100">
          {/* Summary rows */}
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold text-gray-500">Berechnungsstandard</dt>
              <dd className="text-gray-800 mt-0.5">{data.standard}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500">Emissionsfaktoren</dt>
              <dd className="text-gray-800 mt-0.5">{data.factorSourceLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500">Berichtsrahmen</dt>
              <dd className="text-gray-800 mt-0.5">
                {data.includedScopes.length > 0
                  ? data.includedScopes.map((s) => SCOPE_DISPLAY[s] ?? s).join(', ')
                  : 'Keine Emissionen erfasst'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500">Eingabemethoden</dt>
              <dd className="text-gray-800 mt-0.5">
                {data.inputMethodCounts.manual} manuell · {data.inputMethodCounts.ocr} per OCR-Beleg · {data.inputMethodCounts.csv} per CSV
              </dd>
            </div>
          </dl>

          {/* Assumptions */}
          {(data.assumptions || data.exclusions) && (
            <div className="text-sm">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Annahmen & Ausschlüsse</p>
              {data.assumptions && (
                <p className="text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mb-2">{data.assumptions}</p>
              )}
              {data.exclusions && (
                <p className="text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{data.exclusions}</p>
              )}
            </div>
          )}

          {/* Factor table */}
          {data.factors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Verwendete Emissionsfaktoren</p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Kategorie</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Faktor</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Einheit</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Scope</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Quelle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.factors.map((f) => {
                      const isCustom = f.source !== `UBA ${data.factorYear}`;
                      return (
                        <tr key={f.key} className="hover:bg-gray-50/50">
                          <td className="px-3 py-1.5 text-gray-800">{f.label}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-gray-700">{f.factorKg}</td>
                          <td className="px-3 py-1.5 text-gray-600">{f.unit}</td>
                          <td className="px-3 py-1.5 text-gray-600">{SCOPE_DISPLAY[f.scope] ?? f.scope}</td>
                          <td className="px-3 py-1.5">
                            {isCustom ? (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                                Geändert
                              </span>
                            ) : (
                              <span className="text-gray-500">{f.source}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Custom-override warning — shown when any factor deviates from official UBA values */}
              {data.factorSourceLabel.startsWith('Benutzerdefiniert') && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  ⚠ Ein oder mehrere Faktoren wurden manuell angepasst ({data.factorSourceLabel}).
                </p>
              )}
            </div>
          )}

          {/* Footer link to Settings for factor management */}
          <div className="pt-2 border-t border-gray-100">
            <Link
              href="/settings"
              className="text-xs text-brand-green hover:text-brand-green-dark font-medium transition-colors"
            >
              Faktoren verwalten →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
