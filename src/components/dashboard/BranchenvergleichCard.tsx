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
  const isBetter = companyValue < benchmarkValue;
  const diff = Math.abs(companyValue - benchmarkValue);
  const diffPercent = benchmarkValue > 0 ? Math.abs(((companyValue - benchmarkValue) / benchmarkValue) * 100).toFixed(0) : '—';

  return (
    <div className="rounded-2xl border border-card-border bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Branchenvergleich</p>
      <p className="mt-0.5 text-xs text-gray-400">{brancheLabel} · {mitarbeiter} MA</p>

      <div className="mt-5 space-y-4">
        {/* Company bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium">Ihr Betrieb</span>
            <span className="font-bold text-brand-green">{companyValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-brand-gradient transition-all duration-500"
              style={{ width: `${Math.min(100, (companyValue / Math.max(companyValue, benchmarkValue)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Benchmark bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium">Branchendurchschnitt</span>
            <span className="font-bold text-gray-500">{benchmarkValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gray-300 transition-all duration-500"
              style={{ width: `${Math.min(100, (benchmarkValue / Math.max(companyValue, benchmarkValue)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
        isBetter ? 'bg-brand-green-pale text-brand-green' : 'bg-red-50 text-red-600'
      }`}>
        <span className="text-base">{isBetter ? '✓' : '⚠'}</span>
        <span>
          {isBetter
            ? `${diffPercent}% unter dem Branchendurchschnitt (−${diff.toFixed(1)} t/MA)`
            : `${diffPercent}% über dem Branchendurchschnitt (+${diff.toFixed(1)} t/MA)`}
        </span>
      </div>
    </div>
  );
}
