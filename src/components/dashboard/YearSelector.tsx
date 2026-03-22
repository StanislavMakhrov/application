'use client';

/**
 * Year selector for the dashboard — allows switching between available reporting years.
 */

import { useRouter } from 'next/navigation';

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
}

export function YearSelector({ years, selectedYear }: YearSelectorProps) {
  const router = useRouter();

  return (
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
      </div>
    </div>
  );
}
