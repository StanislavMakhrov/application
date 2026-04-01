'use client';

/**
 * EmissionsfaktorenTable — editable table of emission factors for a given year.
 *
 * Fetches GET /api/emission-factors?year={year} when the year changes.
 * Supports inline editing of the factorKg value; changed rows are highlighted
 * with an amber left border (dirty state). Saving calls PUT for each dirty row.
 *
 * Rows where source ≠ "UBA {year}" show a "Geändert" badge to indicate
 * they have been manually overridden.
 */

import { useState, useEffect, useCallback } from 'react';

interface EmissionFactor {
  id: number;
  key: string;
  label: string;
  factorKg: number;
  unit: string;
  scope: string;
  source: string;
  validYear: number;
}

const SCOPE_LABELS: Record<string, string> = {
  SCOPE1: 'Scope 1',
  SCOPE2: 'Scope 2',
  SCOPE3: 'Scope 3',
};

interface EmissionsfaktorenTableProps {
  year: number;
  /** Incremented by parent to trigger a data refresh (e.g. after UBA auto-fill) */
  refreshKey: number;
}

export function EmissionsfaktorenTable({ year, refreshKey }: EmissionsfaktorenTableProps) {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Map of factorId → edited value (only present for dirty rows)
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [saveErrors, setSaveErrors] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchFactors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEdits({});
    setSaveErrors({});
    try {
      const res = await fetch(`/api/emission-factors?year=${year}`);
      if (!res.ok) throw new Error('Fehler beim Laden der Emissionsfaktoren.');
      const data = (await res.json()) as EmissionFactor[];
      setFactors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler.');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  // Re-fetch whenever year or refreshKey changes
  useEffect(() => {
    void fetchFactors();
  }, [fetchFactors, refreshKey]);

  const handleEdit = (id: number, rawValue: string) => {
    const parsed = parseFloat(rawValue.replace(',', '.'));
    if (!isNaN(parsed)) {
      setEdits((prev) => ({ ...prev, [id]: parsed }));
    }
  };

  const handleSave = async () => {
    const dirtyIds = Object.keys(edits).map(Number);
    if (dirtyIds.length === 0) return;

    setIsSaving(true);
    const newSaveErrors: Record<number, string> = {};

    await Promise.all(
      dirtyIds.map(async (id) => {
        try {
          const res = await fetch(`/api/emission-factors/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factorKg: edits[id] }),
          });
          if (!res.ok) {
            const data = (await res.json()) as { error?: string };
            newSaveErrors[id] = data.error ?? 'Fehler beim Speichern.';
          }
        } catch {
          newSaveErrors[id] = 'Netzwerkfehler.';
        }
      })
    );

    setSaveErrors(newSaveErrors);

    // Only clear dirty state for successfully saved rows
    if (Object.keys(newSaveErrors).length === 0) {
      // Refresh to get updated sources from DB
      void fetchFactors();
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <p className="text-sm text-gray-400 animate-pulse">Faktoren werden geladen…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>;
  }

  if (factors.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Keine Emissionsfaktoren für {year} gefunden. Übernehmen Sie die offiziellen UBA-Werte, um zu beginnen.
      </p>
    );
  }

  const dirtyCount = Object.keys(edits).length;

  return (
    <div>
      {/* Scrollable table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Kategorie</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Schlüssel</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600">Faktor (kg CO₂e)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Einheit</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Scope</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Quelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {factors.map((factor) => {
              const isDirty = edits[factor.id] !== undefined;
              const isCustom = factor.source !== `UBA ${factor.validYear}`;
              const displayValue =
                edits[factor.id] !== undefined
                  ? edits[factor.id]
                  : factor.factorKg;

              return (
                <tr
                  key={factor.id}
                  className={`transition-colors ${isDirty ? 'border-l-2 border-amber-400 bg-amber-50/40' : 'hover:bg-gray-50/50'}`}
                >
                  <td className="px-3 py-2 text-gray-800">{factor.label}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{factor.key}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="any"
                      value={displayValue}
                      onChange={(e) => handleEdit(factor.id, e.target.value)}
                      className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                      aria-label={`Faktor für ${factor.label}`}
                    />
                    {saveErrors[factor.id] && (
                      <p className="text-xs text-red-600 mt-0.5">{saveErrors[factor.id]}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{factor.unit}</td>
                  <td className="px-3 py-2 text-gray-600">{SCOPE_LABELS[factor.scope] ?? factor.scope}</td>
                  <td className="px-3 py-2">
                    {isCustom ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Geändert
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        {factor.source}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save button — only shown when there are unsaved changes */}
      {dirtyCount > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60 transition-colors"
          >
            {isSaving ? 'Speichern…' : `💾 Speichern (${dirtyCount} geändert)`}
          </button>
          <button
            type="button"
            onClick={() => setEdits({})}
            disabled={isSaving}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Verwerfen
          </button>
        </div>
      )}
    </div>
  );
}
