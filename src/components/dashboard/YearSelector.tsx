'use client';

/**
 * Year selector for the dashboard — allows switching between available reporting years
 * and adding the next reporting year.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createYear } from '@/lib/actions';

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  nextYear: number;
}

export function YearSelector({ years, selectedYear, nextYear }: YearSelectorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleAddYear() {
    setError(null);
    const result = await createYear(nextYear);
    if (result.success && result.year != null) {
      router.push(`/?year=${result.year}`);
    } else {
      setError(result.error ?? 'Berichtsjahr konnte nicht erstellt werden.');
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Berichtsjahr:</span>
        <div className="flex gap-1">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => router.push(`/?year=${year}`)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                year === selectedYear
                  ? 'bg-brand-green text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {year}
            </button>
          ))}
          <button
            onClick={handleAddYear}
            title={`Berichtsjahr ${nextYear} hinzufügen`}
            className="rounded-md px-2 py-1.5 text-sm font-medium transition-colors min-h-[36px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
