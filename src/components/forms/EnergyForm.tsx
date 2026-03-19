'use client';

/**
 * Energy input form — annual energy consumption data entry.
 * Calculates CO₂ preview on the client and saves via the energy-entries service.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { saveEnergyEntry } from '@/services/energy-entries';
import { calculateFootprint } from '@/lib/calculator';
import { UBA_2024 } from '@/lib/emission-factors';

interface EnergyFormProps {
  companyId: string;
}

// Year dropdown: current year and 3 previous years
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

const energySchema = z.object({
  year: z.number().int().min(2000).max(currentYear),
  strom_kwh: z.number().min(0, 'Muss ≥ 0 sein.'),
  erdgas_m3: z.number().min(0, 'Muss ≥ 0 sein.'),
  diesel_l: z.number().min(0, 'Muss ≥ 0 sein.'),
  heizoel_l: z.number().min(0, 'Muss ≥ 0 sein.'),
});

export default function EnergyForm({ companyId }: EnergyFormProps) {
  const router = useRouter();
  const [year, setYear] = useState(String(currentYear));
  const [stromKwh, setStromKwh] = useState('');
  const [erdgasM3, setErdgasM3] = useState('');
  const [dieselL, setDieselL] = useState('');
  const [heizoeLL, setHeizoeLL] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live preview of CO₂ calculation
  const previewInputs = {
    strom_kwh: parseFloat(stromKwh) || 0,
    erdgas_m3: parseFloat(erdgasM3) || 0,
    diesel_l: parseFloat(dieselL) || 0,
    heizoel_l: parseFloat(heizoeLL) || 0,
  };
  const preview = calculateFootprint(previewInputs, UBA_2024);
  const hasInput = Object.values(previewInputs).some((v) => v > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = energySchema.safeParse({
      year: parseInt(year, 10),
      strom_kwh: parseFloat(stromKwh) || 0,
      erdgas_m3: parseFloat(erdgasM3) || 0,
      diesel_l: parseFloat(dieselL) || 0,
      heizoel_l: parseFloat(heizoeLL) || 0,
    });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const entry = await saveEnergyEntry({
        company_id: companyId,
        ...result.data,
      });

      if (!entry) {
        setError('Energiedaten konnten nicht gespeichert werden. Bitte erneut versuchen.');
        return;
      }

      router.push(`/results/${result.data.year}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Year selection */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Berichtsjahr <span className="text-red-500">*</span>
          </label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Scope 2 inputs */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Scope 2 — Strom (indirekte Emissionen)
          </p>
          <div>
            <label htmlFor="strom" className="block text-sm font-medium text-gray-700 mb-1">
              Stromverbrauch (kWh)
            </label>
            <input
              id="strom"
              type="number"
              value={stromKwh}
              onChange={(e) => setStromKwh(e.target.value)}
              min={0}
              step="any"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="z.B. 15000"
            />
          </div>
        </div>

        {/* Scope 1 inputs */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Scope 1 — Brennstoffe (direkte Emissionen)
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="erdgas" className="block text-sm font-medium text-gray-700 mb-1">
                Erdgas (m³)
              </label>
              <input
                id="erdgas"
                type="number"
                value={erdgasM3}
                onChange={(e) => setErdgasM3(e.target.value)}
                min={0}
                step="any"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. 2000"
              />
            </div>

            <div>
              <label htmlFor="diesel" className="block text-sm font-medium text-gray-700 mb-1">
                Diesel (L)
              </label>
              <input
                id="diesel"
                type="number"
                value={dieselL}
                onChange={(e) => setDieselL(e.target.value)}
                min={0}
                step="any"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. 1500"
              />
            </div>

            <div>
              <label htmlFor="heizoel" className="block text-sm font-medium text-gray-700 mb-1">
                Heizöl (L)
              </label>
              <input
                id="heizoel"
                type="number"
                value={heizoeLL}
                onChange={(e) => setHeizoeLL(e.target.value)}
                min={0}
                step="any"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. 500"
              />
            </div>
          </div>
        </div>

        {/* Live CO₂ preview */}
        {hasInput && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm">
            <p className="font-semibold text-green-800 mb-2">CO₂-Vorschau (UBA 2024)</p>
            <div className="space-y-1 text-green-700">
              <div className="flex justify-between">
                <span>Scope 1:</span>
                <span>{preview.scope1_t.toFixed(3)} t CO₂</span>
              </div>
              <div className="flex justify-between">
                <span>Scope 2:</span>
                <span>{preview.scope2_t.toFixed(3)} t CO₂</span>
              </div>
              <div className="flex justify-between font-bold border-t border-green-200 pt-1 mt-1">
                <span>Gesamt:</span>
                <span>{preview.total_t.toFixed(3)} t CO₂</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          {loading ? 'Berechnen…' : 'CO₂-Bilanz berechnen →'}
        </button>
      </form>
    </div>
  );
}
