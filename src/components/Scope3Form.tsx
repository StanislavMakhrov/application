/**
 * Scope 3 input form for GrünBilanz.
 * Handles value chain emissions: Geschäftsreisen (Flug, Pkw, Bahn), Abfall.
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

interface Scope3FormProps {
  periodId: number;
  year: number;
  factors: EmissionFactor[];
  existingEntries: ExistingEntry[];
  onSaved: () => void;
}

const SCOPE3_SOURCES = [
  { category: 'Flug', subcategory: 'Kurzstrecke', label: 'Flug Kurzstrecke (< 1000 km)', unit: 'km', icon: '✈️', hint: 'Dienstflüge unter 1.000 km' },
  { category: 'Flug', subcategory: 'Mittelstrecke', label: 'Flug Mittelstrecke', unit: 'km', icon: '✈️', hint: 'Dienstflüge 1.000 – 3.500 km' },
  { category: 'Pkw', subcategory: 'Diesel', label: 'Pkw Diesel', unit: 'km', icon: '🚗', hint: 'Dienstfahrten mit Diesel-Pkw' },
  { category: 'Pkw', subcategory: 'Benzin', label: 'Pkw Benzin', unit: 'km', icon: '🚗', hint: 'Dienstfahrten mit Benzin-Pkw' },
  { category: 'Bahn', subcategory: null, label: 'Bahn', unit: 'km', icon: '🚂', hint: 'Dienstfahrten mit der Bahn' },
  { category: 'Abfall', subcategory: 'gemischt', label: 'Abfall (gemischt)', unit: 'kg', icon: '🗑️', hint: 'Gemischter Gewerbeabfall' },
];

function makeKey(category: string, subcategory: string | null): string {
  return subcategory ? `${category}_${subcategory}` : category;
}

export default function Scope3Form({ periodId, year, factors, existingEntries, onSaved }: Scope3FormProps) {
  const initialValues: Record<string, string> = {};
  for (const source of SCOPE3_SOURCES) {
    const key = makeKey(source.category, source.subcategory);
    const entry = existingEntries.find(
      (e) => e.category === source.category && e.subcategory === source.subcategory
    );
    initialValues[key] = entry ? String(entry.quantity) : '';
  }

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function calcPreview(category: string, subcategory: string | null, quantity: string): string {
    if (!quantity || isNaN(Number(quantity))) return '–';
    const factor = factors.find(
      (f) => f.category === category && f.subcategory === subcategory
    );
    if (!factor) return '–';
    const co2e = Number(quantity) * factor.factorKgCo2ePerUnit;
    return `${co2e.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg CO₂e`;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const entries = SCOPE3_SOURCES.filter((s) => {
        const key = makeKey(s.category, s.subcategory);
        return values[key] && Number(values[key]) > 0;
      }).map((source) => {
        const key = makeKey(source.category, source.subcategory);
        const factor = factors.find(
          (f) => f.category === source.category && f.subcategory === source.subcategory
        );
        const quantity = Number(values[key]);
        const co2e = factor ? quantity * factor.factorKgCo2ePerUnit : 0;
        return {
          reportingPeriodId: periodId,
          scope: 'SCOPE3',
          category: source.category,
          subcategory: source.subcategory,
          quantity,
          unit: source.unit,
          co2e,
          sourceType: 'MANUAL',
        };
      });

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, scope: 'SCOPE3', periodId }),
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
        Geben Sie Emissionen aus der Wertschöpfungskette ein. Jahr: {year}
      </p>

      {SCOPE3_SOURCES.map((source) => {
        const key = makeKey(source.category, source.subcategory);
        return (
          <div key={key} className="border border-gray-100 rounded-lg p-4 bg-purple-50/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{source.icon}</span>
                <div>
                  <label
                    htmlFor={`scope3-${key}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    {source.label}
                  </label>
                  <p className="text-xs text-gray-400">{source.hint}</p>
                </div>
              </div>
              <div className="text-xs text-purple-700 font-medium">
                {calcPreview(source.category, source.subcategory, values[key])}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                id={`scope3-${key}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500 shrink-0 w-8">{source.unit}</span>
            </div>
          </div>
        );
      })}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Speichert...' : '✓ Scope 3 speichern & abschließen'}
      </button>
    </div>
  );
}
