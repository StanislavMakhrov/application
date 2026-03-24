'use client';

/**
 * Branchenvergleich card — compares company CO₂e per employee against
 * the industry benchmark for their sector, using gradient progress bars.
 */

interface BranchenvergleichCardProps {
  companyValue: number; // t CO₂e per employee
  benchmarkValue: number; // t CO₂e per employee (industry average)
  brancheLabel: string;
  mitarbeiter: number;
}

export function BranchenvergleichCard({
  companyValue,
  benchmarkValue,
  brancheLabel,
  mitarbeiter,
}: BranchenvergleichCardProps) {
  const isBetter = companyValue < benchmarkValue;
  const diff = Math.abs(companyValue - benchmarkValue);
  const diffPercent = benchmarkValue > 0
    ? Math.abs(((companyValue - benchmarkValue) / benchmarkValue) * 100).toFixed(0)
    : '—';
  const maxVal = Math.max(companyValue, benchmarkValue);

  return (
    <div className="rounded-card border border-card-border bg-white p-5 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Branchenvergleich</p>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
          isBetter ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {isBetter ? `↓ ${diffPercent}%` : `↑ ${diffPercent}%`}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{brancheLabel} · {mitarbeiter} Mitarbeitende</p>

      <div className="space-y-3">
        {/* Company bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-gray-700">Ihr Betrieb</span>
            <span className="font-bold text-gray-900">{companyValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (companyValue / Math.max(maxVal, 0.1)) * 100)}%`,
                background: isBetter
                  ? 'linear-gradient(90deg, #2D6A4F, #52B788)'
                  : 'linear-gradient(90deg, #E76F51, #F4A261)',
              }}
            />
          </div>
        </div>

        {/* Benchmark bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-gray-500">Branchendurchschnitt</span>
            <span className="font-bold text-gray-500">{benchmarkValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gray-300 transition-all duration-700"
              style={{ width: `${Math.min(100, (benchmarkValue / Math.max(maxVal, 0.1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <p className={`mt-3 text-xs ${isBetter ? 'text-green-700' : 'text-red-600'}`}>
        {isBetter
          ? `✓ ${diffPercent}% unter dem Branchendurchschnitt (−${diff.toFixed(1)} t/MA)`
          : `⚠ ${diffPercent}% über dem Branchendurchschnitt (+${diff.toFixed(1)} t/MA)`}
      </p>
    </div>
  );
}
