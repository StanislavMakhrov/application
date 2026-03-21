'use client';

/**
 * Branchenvergleich card — compares company CO₂e per employee against
 * the industry benchmark for their sector.
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
  const percent = benchmarkValue > 0 ? (companyValue / benchmarkValue) * 100 : 0;
  const isBetter = companyValue < benchmarkValue;
  const diff = Math.abs(companyValue - benchmarkValue);
  const diffPercent = benchmarkValue > 0 ? Math.abs(((companyValue - benchmarkValue) / benchmarkValue) * 100).toFixed(0) : '—';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Branchenvergleich</p>
      <p className="mt-1 text-xs text-gray-400">{brancheLabel} · {mitarbeiter} MA</p>

      <div className="mt-4 space-y-2">
        {/* Company bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Ihr Betrieb</span>
            <span className="font-semibold">{companyValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-4 rounded-full bg-brand-green transition-all"
              style={{ width: `${Math.min(100, (companyValue / Math.max(companyValue, benchmarkValue)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Benchmark bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Branchendurchschnitt</span>
            <span className="font-semibold">{benchmarkValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-4 rounded-full bg-gray-400 transition-all"
              style={{ width: `${Math.min(100, (benchmarkValue / Math.max(companyValue, benchmarkValue)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <p className={`mt-3 text-sm font-medium ${isBetter ? 'text-brand-green' : 'text-red-600'}`}>
        {isBetter
          ? `✓ ${diffPercent}% unter dem Branchendurchschnitt (−${diff.toFixed(1)} t/MA)`
          : `⚠ ${diffPercent}% über dem Branchendurchschnitt (+${diff.toFixed(1)} t/MA)`}
      </p>
    </div>
  );
}
