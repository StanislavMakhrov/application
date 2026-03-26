/**
 * IndustryBenchmarkTable — server component for the Settings page.
 *
 * Renders a read-only reference table of industry benchmark CO₂e values
 * per employee per year. Data is pre-fetched by the Settings page Server
 * Component via prisma.industryBenchmark.findMany() — no fetching here.
 */

import type { Branche } from '@/types';
import { BRANCHE_LABELS } from '@/types';

interface BenchmarkRow {
  branche: Branche;
  co2ePerEmployeePerYear: number;
}

interface IndustryBenchmarkTableProps {
  benchmarks: BenchmarkRow[];
}

/**
 * Formats a CO₂e value in tonnes using de-DE locale with 1 decimal place.
 */
function formatTonnes(value: number): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function IndustryBenchmarkTable({ benchmarks }: IndustryBenchmarkTableProps) {
  if (benchmarks.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Keine Branchenbenchmarks vorhanden.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left pb-2 pr-4 font-medium text-gray-600">Branche</th>
            <th className="text-left pb-2 font-medium text-gray-600">
              CO₂e/MA/Jahr (t)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {benchmarks.map((b) => (
            <tr key={b.branche} className="hover:bg-gray-50">
              <td className="py-2 pr-4 text-gray-700">
                {BRANCHE_LABELS[b.branche] ?? b.branche}
              </td>
              <td className="py-2 font-mono text-gray-700">
                {formatTonnes(b.co2ePerEmployeePerYear)} t
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
