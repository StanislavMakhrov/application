/**
 * Static industry benchmark data per Branche (German craft trade sector).
 * Values are estimated median, p25, and p75 CO₂ tonnes per year based on
 * typical energy profiles for German Handwerksbetriebe.
 * Used for comparative analysis in the results view and PDF report.
 */

import type { BenchmarkData, Branche } from '@/types';

/** Industry benchmarks indexed by Branche */
const BENCHMARK_DATA: Record<Branche, Omit<BenchmarkData, 'branche'>> = {
  'Elektrotechnik': { median_t: 8.5, p25_t: 4.2, p75_t: 15.3 },
  'Sanitär/Heizung/Klima': { median_t: 12.0, p25_t: 6.0, p75_t: 20.0 },
  'Maler/Lackierer': { median_t: 6.5, p25_t: 3.5, p75_t: 11.0 },
  'Schreiner/Tischler': { median_t: 15.0, p25_t: 8.0, p75_t: 25.0 },
  'Kfz-Handwerk': { median_t: 22.0, p25_t: 12.0, p75_t: 38.0 },
  'Bäcker/Konditor': { median_t: 35.0, p25_t: 20.0, p75_t: 55.0 },
  'Fleischer': { median_t: 28.0, p25_t: 15.0, p75_t: 45.0 },
  'Friseur': { median_t: 3.5, p25_t: 1.8, p75_t: 6.0 },
  'Gebäudereinigung': { median_t: 5.0, p25_t: 2.5, p75_t: 9.0 },
  'Sonstiges': { median_t: 10.0, p25_t: 5.0, p75_t: 18.0 },
};

/**
 * Get benchmark data for a specific Branche.
 * Falls back to 'Sonstiges' data if branche is not found.
 */
export function getBenchmark(branche: Branche): BenchmarkData {
  const data = BENCHMARK_DATA[branche] ?? BENCHMARK_DATA['Sonstiges'];
  return { branche, ...data };
}

/** Get all benchmark data entries */
export function getAllBenchmarks(): BenchmarkData[] {
  return (Object.entries(BENCHMARK_DATA) as [Branche, Omit<BenchmarkData, 'branche'>][]).map(
    ([branche, data]) => ({ branche, ...data })
  );
}
