'use client';

/**
 * BenchmarkChart — visual comparison of a company's CO₂ footprint against
 * industry peer benchmarks (P25 / Median / P75).
 *
 * Renders a horizontal bar chart using pure Tailwind CSS — no charting library
 * dependency required, keeping the bundle small.
 *
 * The chart width is computed by scaling all values relative to a common maximum
 * (1.25× P75 to ensure the chart never clips high-emission companies).
 */
import type { Benchmark } from '@/lib/benchmarks';

interface BenchmarkChartProps {
  /** The company's total CO₂e in metric tonnes */
  companyTotal_t: number;
  /** Benchmark data for the company's Branche */
  benchmark: Benchmark;
}

function pct(value: number, max: number): number {
  // Clamp to [0, 100] — values beyond the chart maximum still render at edge
  return Math.min(100, Math.round((value / max) * 100));
}

export default function BenchmarkChart({ companyTotal_t, benchmark }: BenchmarkChartProps) {
  // Scale maximum is 25 % above the P75 to give headroom at the right edge
  const max = benchmark.p75_t * 1.25;

  const bars: { label: string; value: number; color: string; bold?: boolean }[] = [
    { label: 'Ihr Betrieb', value: companyTotal_t, color: 'bg-green-500', bold: true },
    { label: '25. Perzentile', value: benchmark.p25_t, color: 'bg-blue-300' },
    { label: 'Median', value: benchmark.median_t, color: 'bg-blue-500' },
    { label: '75. Perzentile', value: benchmark.p75_t, color: 'bg-blue-700' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">
        Branchenvergleich: {benchmark.branche}
      </h3>

      {bars.map(({ label, value, color, bold }) => (
        <div key={label} className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span className={bold ? 'font-semibold text-gray-800' : ''}>{label}</span>
            <span className={bold ? 'font-semibold text-gray-800' : ''}>
              {value.toFixed(1)} t CO₂e
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${color}`}
              style={{ width: `${pct(value, max)}%` }}
            />
          </div>
        </div>
      ))}

      <p className="mt-2 text-xs text-gray-400">
        Benchmark-Daten: geschätzte Branchenwerte für deutsche Handwerksbetriebe, 2024
      </p>
    </div>
  );
}
