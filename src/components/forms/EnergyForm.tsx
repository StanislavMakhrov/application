'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  strom_kwh: z.number().min(0, 'Wert darf nicht negativ sein'),
  erdgas_m3: z.number().min(0),
  diesel_l: z.number().min(0),
  heizoel_l: z.number().min(0),
});

interface EnergyFormProps {
  companyId: string | null;
  defaultYear: number;
}

/**
 * Annual energy data input form.
 * Collects electricity, gas, diesel, and heating oil consumption.
 */
export function EnergyForm({ defaultYear }: EnergyFormProps) {
  const router = useRouter();
  const [year, setYear] = useState(defaultYear.toString());
  const [strom, setStrom] = useState('');
  const [erdgas, setErdgas] = useState('');
  const [diesel, setDiesel] = useState('');
  const [heizoel, setHeizoel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = schema.safeParse({
      year: parseInt(year, 10),
      strom_kwh: parseFloat(strom) || 0,
      erdgas_m3: parseFloat(erdgas) || 0,
      diesel_l: parseFloat(diesel) || 0,
      heizoel_l: parseFloat(heizoel) || 0,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Ungültige Eingabe');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Speichern');
        return;
      }

      router.push(`/results/${parsed.data.year}`);
    } catch {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Year selector */}
      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
          Berichtsjahr *
        </label>
        <select
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
        >
          {Array.from({ length: 5 }, (_, i) => defaultYear - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded flex items-center justify-center text-xs font-bold">2</span>
          Scope 2 – Strom
        </legend>
        <div>
          <label htmlFor="strom_kwh" className="block text-sm text-gray-600 mb-1">
            Stromverbrauch (kWh/Jahr)
          </label>
          <input
            id="strom_kwh"
            type="number"
            min="0"
            step="0.1"
            value={strom}
            onChange={(e) => setStrom(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            placeholder="z. B. 25000"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded flex items-center justify-center text-xs font-bold">1</span>
          Scope 1 – Direkte Verbrennung
        </legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="erdgas_m3" className="block text-sm text-gray-600 mb-1">
              Erdgas (m³/Jahr)
            </label>
            <input
              id="erdgas_m3"
              type="number"
              min="0"
              step="0.1"
              value={erdgas}
              onChange={(e) => setErdgas(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="z. B. 3000"
            />
          </div>
          <div>
            <label htmlFor="diesel_l" className="block text-sm text-gray-600 mb-1">
              Diesel (Liter/Jahr)
            </label>
            <input
              id="diesel_l"
              type="number"
              min="0"
              step="0.1"
              value={diesel}
              onChange={(e) => setDiesel(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="z. B. 1500"
            />
          </div>
          <div>
            <label htmlFor="heizoel_l" className="block text-sm text-gray-600 mb-1">
              Heizöl (Liter/Jahr)
            </label>
            <input
              id="heizoel_l"
              type="number"
              min="0"
              step="0.1"
              value={heizoel}
              onChange={(e) => setHeizoel(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="z. B. 0"
            />
          </div>
        </div>
      </fieldset>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Berechne CO₂…' : 'CO₂-Bilanz berechnen →'}
        </button>
      </div>
    </form>
  );
}
