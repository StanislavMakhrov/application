'use client';

/**
 * EnergyForm — annual energy consumption input form.
 *
 * Collects: Jahr (year), Strom (kWh), Erdgas (m³), Diesel (L), Heizöl (L).
 * Submitted data is passed to the `saveEnergyEntry` Server Action which
 * calculates CO₂ values and persists them. On success the user is redirected
 * to the results page for that year.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnergyFormProps {
  /** Existing energy data pre-populates the form for the selected year */
  initialData?: {
    year: number;
    stromKwh: number;
    erdgasM3: number;
    dieselL: number;
    heizoeL: number;
  };
  /** Server action to call on submit */
  saveEnergyEntry: (formData: FormData) => Promise<{ error?: string; year?: number }>;
}

const CURRENT_YEAR = new Date().getFullYear();
// Offer data entry for the past 5 years
const AVAILABLE_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function EnergyForm({ initialData, saveEnergyEntry }: EnergyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(initialData?.year ?? CURRENT_YEAR);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await saveEnergyEntry(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Navigate to the results page for the entered year
    const year = result?.year ?? selectedYear;
    router.push(`/results/${year}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Jahr */}
      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
          Jahr
        </label>
        <select
          id="year"
          name="year"
          required
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Strom */}
      <div>
        <label htmlFor="stromKwh" className="block text-sm font-medium text-gray-700">
          Stromverbrauch <span className="text-gray-400">(kWh)</span>
        </label>
        <input
          id="stromKwh"
          name="stromKwh"
          type="number"
          required
          min={0}
          step="0.01"
          defaultValue={initialData?.stromKwh ?? ''}
          placeholder="z. B. 25000"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <p className="mt-1 text-xs text-gray-400">Strom aus dem deutschen Netz (Scope 2)</p>
      </div>

      {/* Erdgas */}
      <div>
        <label htmlFor="erdgasM3" className="block text-sm font-medium text-gray-700">
          Erdgasverbrauch <span className="text-gray-400">(m³)</span>
        </label>
        <input
          id="erdgasM3"
          name="erdgasM3"
          type="number"
          required
          min={0}
          step="0.01"
          defaultValue={initialData?.erdgasM3 ?? ''}
          placeholder="z. B. 5000"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <p className="mt-1 text-xs text-gray-400">Heizen, Warmwasser (Scope 1)</p>
      </div>

      {/* Diesel */}
      <div>
        <label htmlFor="dieselL" className="block text-sm font-medium text-gray-700">
          Dieselverbrauch <span className="text-gray-400">(Liter)</span>
        </label>
        <input
          id="dieselL"
          name="dieselL"
          type="number"
          required
          min={0}
          step="0.01"
          defaultValue={initialData?.dieselL ?? ''}
          placeholder="z. B. 3000"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <p className="mt-1 text-xs text-gray-400">Firmenfahrzeuge, Maschinen (Scope 1)</p>
      </div>

      {/* Heizöl */}
      <div>
        <label htmlFor="heizoeL" className="block text-sm font-medium text-gray-700">
          Heizölverbrauch <span className="text-gray-400">(Liter)</span>
        </label>
        <input
          id="heizoeL"
          name="heizoeL"
          type="number"
          required
          min={0}
          step="0.01"
          defaultValue={initialData?.heizoeL ?? ''}
          placeholder="z. B. 2000"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <p className="mt-1 text-xs text-gray-400">Ölheizung (Scope 1)</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Wird berechnet…' : 'CO₂ berechnen und speichern'}
      </button>
    </form>
  );
}
