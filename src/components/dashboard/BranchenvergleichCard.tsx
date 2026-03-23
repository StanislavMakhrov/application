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
  const maxVal = Math.max(companyValue, benchmarkValue);

  return (
    <div className="rounded-2xl border border-card-border bg-white shadow-card p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Branchenvergleich</p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isBetter
              ? 'bg-brand-green-muted text-brand-green'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {isBetter ? `↓ ${diffPercent}%` : `↑ ${diffPercent}%`}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{brancheLabel} · {mitarbeiter} MA</p>

      <div className="space-y-3">
        {/* Company bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span className="font-medium">Ihr Betrieb</span>
            <span className="font-bold text-brand-green">{companyValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-card-accent transition-all duration-500"
              style={{ width: `${Math.min(100, maxVal > 0 ? (companyValue / maxVal) * 100 : 0)}%` }}
            />
          </div>
        </div>

        {/* Benchmark bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span className="font-medium">Branchendurchschnitt</span>
            <span className="font-bold text-gray-500">{benchmarkValue.toFixed(1)} t/MA</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gray-300 transition-all duration-500"
              style={{ width: `${Math.min(100, maxVal > 0 ? (benchmarkValue / maxVal) * 100 : 0)}%` }}
            />
          </div>
        </div>
      </div>

      <p className={`mt-4 text-xs font-semibold ${isBetter ? 'text-brand-green' : 'text-red-600'}`}>
        {isBetter
          ? `✓ ${diffPercent}% unter dem Branchendurchschnitt (−${diff.toFixed(1)} t/MA)`
          : `⚠ ${diffPercent}% über dem Branchendurchschnitt (+${diff.toFixed(1)} t/MA)`}
      </p>
    </div>
  );
}
