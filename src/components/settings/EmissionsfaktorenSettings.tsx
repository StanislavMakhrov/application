'use client';

/**
 * EmissionsfaktorenSettings — Settings section for managing emission factors per year.
 *
 * Combines:
 * - Year selector (built from dbYears + ubaReferenceYears from the API)
 * - EmissionsfaktorenTable (editable factor table for the selected year)
 * - UbaFillButton (one-click auto-fill with confirmation dialog)
 *
 * Integrates into the Settings page below the "Berichtsjahre" section.
 */

import { useState, useEffect } from 'react';
import { EmissionsfaktorenTable } from './EmissionsfaktorenTable';
import { UbaFillButton } from './UbaFillButton';

interface YearsResponse {
  dbYears: number[];
  ubaReferenceYears: number[];
}

export function EmissionsfaktorenSettings() {
  const [dbYears, setDbYears] = useState<number[]>([]);
  const [ubaReferenceYears, setUbaReferenceYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Incrementing this key forces the table to re-fetch after an auto-fill
  const [tableRefreshKey, setTableRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/emission-factors/years')
      .then((r) => r.json())
      .then((data: YearsResponse) => {
        setDbYears(data.dbYears ?? []);
        setUbaReferenceYears(data.ubaReferenceYears ?? []);
        // Deduplicate using filter instead of Set spread (tsconfig target compatibility)
        const allYears = [...data.dbYears, ...data.ubaReferenceYears]
          .filter((y, i, arr) => arr.indexOf(y) === i)
          .sort((a, b) => b - a);
        if (allYears.length > 0) {
          setSelectedYear(allYears[0]);
        }
      })
      .catch(() => {
        // Non-fatal: show empty state
      })
      .finally(() => setIsLoading(false));
  }, []);

  // All years to show in the selector: union of DB years and reference years, deduped
  const allYears = [...dbYears, ...ubaReferenceYears]
    .filter((y, i, arr) => arr.indexOf(y) === i)
    .sort((a, b) => b - a);

  if (isLoading) {
    return <p className="text-sm text-gray-400 animate-pulse">Berichtsjahre werden geladen…</p>;
  }

  if (allYears.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Keine Berichtsjahre gefunden. Legen Sie zuerst ein Berichtsjahr unter &ldquo;Berichtsjahre&rdquo; an.
      </p>
    );
  }

  const currentYear = selectedYear ?? allYears[0];
  const isUbaAvailable = ubaReferenceYears.includes(currentYear);

  return (
    <div className="space-y-4">
      {/* Year selector + auto-fill button row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="ef-year-select"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Berichtsjahr:
          </label>
          <select
            id="ef-year-select"
            value={currentYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <UbaFillButton
          year={currentYear}
          isAvailable={isUbaAvailable}
          onSuccess={() => setTableRefreshKey((k) => k + 1)}
        />
      </div>

      {/* Editable factor table */}
      <EmissionsfaktorenTable year={currentYear} refreshKey={tableRefreshKey} />
    </div>
  );
}
