'use client';

/**
 * EmissionsfaktorenSettings — Settings section for managing emission factors per year.
 *
 * Combines:
 * - Year selector (built from dbYears from the API)
 * - EmissionsfaktorenTable (editable factor table for the selected year)
 * - UbaFillButton (stub placeholder for UBA auto-fill)
 *
 * `reportingYears` is passed from the server component so that when YearManagement
 * calls router.refresh() after adding/deleting a year, the server re-renders and
 * passes a fresh array reference here, triggering a re-fetch of the year list without
 * requiring a full page reload.
 *
 * Integrates into the Settings page below the "Berichtsjahre" section.
 */

import { useState, useEffect } from 'react';
import { EmissionsfaktorenTable } from './EmissionsfaktorenTable';
import { UbaFillButton } from './UbaFillButton';

interface YearsResponse {
  dbYears: number[];
}

interface Props {
  /** Reporting years from the server component — used as a refresh trigger. */
  reportingYears: number[];
}

export function EmissionsfaktorenSettings({ reportingYears }: Props) {
  const [dbYears, setDbYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Incrementing this key forces the table to re-fetch after an auto-fill
  const [tableRefreshKey, setTableRefreshKey] = useState(0);

  // Re-fetch whenever reportingYears changes (i.e. after a year is added/deleted
  // and YearManagement calls router.refresh(), which re-renders the server component
  // and passes a new array reference here).
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/emission-factors/years')
      .then((r) => r.json())
      .then((data: YearsResponse) => {
        const years = (data.dbYears ?? []).sort((a, b) => b - a);
        setDbYears(years);
        setSelectedYear((prev) => {
          // Keep the currently selected year if it's still in the list;
          // otherwise default to the most recent year.
          if (prev !== null && years.includes(prev)) return prev;
          return years.length > 0 ? years[0] : null;
        });
      })
      .catch(() => {
        // Non-fatal: show empty state
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingYears]);

  if (isLoading) {
    return <p className="text-sm text-gray-400 animate-pulse">Berichtsjahre werden geladen…</p>;
  }

  if (dbYears.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Keine Berichtsjahre gefunden. Legen Sie zuerst ein Berichtsjahr unter &ldquo;Berichtsjahre&rdquo; an.
      </p>
    );
  }

  const currentYear = selectedYear ?? dbYears[0];

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
            {dbYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <UbaFillButton />
      </div>

      {/* Editable factor table */}
      <EmissionsfaktorenTable year={currentYear} refreshKey={tableRefreshKey} />
    </div>
  );
}
