/**
 * Scope 2 input form for GrünBilanz.
 * Handles indirect emissions from purchased energy: Strom, Fernwärme.
 * Saves data via API and calls onSaved when complete.
 */

'use client';

import { useState } from 'react';

interface EmissionFactor {
  id: number;
  category: string;
  subcategory: string | null;
  factorKgCo2ePerUnit: number;
  unit: string;
}

interface ExistingEntry {
  category: string;
  subcategory: string | null;
  quantity: number;
  unit: string;
  co2e: number;
}

interface Scope2FormProps {
  periodId: number;
  year: number;
  factors: EmissionFactor[];
  existingEntries: ExistingEntry[];
  onSaved: () => void;
}

const SCOPE2_SOURCES = [
  { category: 'Strom', label: 'Stromverbrauch', unit: 'kWh', icon: '⚡', hint: 'Jährlicher Stromverbrauch (Zählerstand)' },
  { category: 'Fernwärme', label: 'Fernwärme', unit: 'kWh', icon: '♨️', hint: 'Wärmeenergie aus Fernwärmenetz' },
];

export default function Scope2Form({ periodId, year, factors, existingEntries, onSaved }: Scope2FormProps) {
  const initialValues: Record<string, string> = {};
  for (const source of SCOPE2_SOURCES) {
    const entry = existingEntries.find((e) => e.category === source.category);
    initialValues[source.category] = entry ? String(entry.quantity) : '';
  }

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function calcPreview(category: string, quantity: string): string {
    if (!quantity || isNaN(Number(quantity))) return '–';
    const factor = factors.find((f) => f.category === category);
    if (!factor) return '–';
    const co2e = Number(quantity) * factor.factorKgCo2ePerUnit;
    return `${co2e.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg CO₂e`;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const entries = SCOPE2_SOURCES.filter((s) => values[s.category] && Number(values[s.category]) > 0)
        .map((source) => {
          const factor = factors.find((f) => f.category === source.category);
          const quantity = Number(values[source.category]);
          const co2e = factor ? quantity * factor.factorKgCo2ePerUnit : 0;
          return {
            reportingPeriodId: periodId,
            scope: 'SCOPE2',
            category: source.category,
            subcategory: null,
            quantity,
            unit: source.unit,
            co2e,
            sourceType: 'MANUAL',
          };
        });

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, scope: 'SCOPE2', periodId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? 'Speicherfehler');
      }

      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Geben Sie den Verbrauch von extern bezogener Energie ein. Jahr: {year}
      </p>

      {SCOPE2_SOURCES.map((source) => (
        <div key={source.category} className="border border-gray-100 rounded-lg p-4 bg-blue-50/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{source.icon}</span>
              <div>
                <label
                  htmlFor={`scope2-${source.category}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  {source.label}
                </label>
                <p className="text-xs text-gray-400">{source.hint}</p>
              </div>
            </div>
            <div className="text-xs text-blue-700 font-medium">
              {calcPreview(source.category, values[source.category])}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              id={`scope2-${source.category}`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={values[source.category]}
              onChange={(e) => setValues((v) => ({ ...v, [source.category]: e.target.value }))}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-500 shrink-0 w-8">{source.unit}</span>
          </div>
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Speichert...' : 'Scope 2 speichern & weiter →'}
      </button>
    </div>
  );
}
