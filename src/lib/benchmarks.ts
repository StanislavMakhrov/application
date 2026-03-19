/**
 * Industry benchmark data for German Handwerk trades.
 *
 * Benchmarks represent anonymised peer-group CO₂ footprints per Branche (trade category).
 * Values are in metric tonnes CO₂ per year and are derived from typical consumption patterns
 * for small-to-medium Handwerksbetriebe with 5–20 employees.
 *
 * p25/median/p75 represent the 25th, 50th and 75th percentile of the distribution,
 * allowing a company to understand where it sits relative to its peers.
 */

export const BRANCHEN = [
  'Elektrotechnik',
  'Sanitär/Heizung/Klima',
  'Maler/Lackierer',
  'Tischler/Schreiner',
  'Kfz-Mechatronik',
  'Bäcker',
  'Fleischer',
  'Friseur',
  'Zimmerer',
  'Dachdecker',
  'Maurer/Betonbauer',
  'Sonstiges',
] as const;

export type Branche = (typeof BRANCHEN)[number];

export interface BenchmarkData {
  branche: Branche;
  year: number;
  median_t: number;
  p25_t: number;
  p75_t: number;
}

/** UBA-calibrated benchmark values for the 2024 reporting year. */
export const BENCHMARKS_2024: BenchmarkData[] = [
  { branche: 'Elektrotechnik', year: 2024, median_t: 8.5, p25_t: 4.2, p75_t: 15.8 },
  { branche: 'Sanitär/Heizung/Klima', year: 2024, median_t: 12.3, p25_t: 6.1, p75_t: 22.4 },
  { branche: 'Maler/Lackierer', year: 2024, median_t: 6.2, p25_t: 3.1, p75_t: 11.5 },
  { branche: 'Tischler/Schreiner', year: 2024, median_t: 9.8, p25_t: 5.2, p75_t: 18.1 },
  { branche: 'Kfz-Mechatronik', year: 2024, median_t: 18.4, p25_t: 9.2, p75_t: 32.6 },
  { branche: 'Bäcker', year: 2024, median_t: 24.6, p25_t: 12.3, p75_t: 42.8 },
  { branche: 'Fleischer', year: 2024, median_t: 22.1, p25_t: 11.0, p75_t: 38.5 },
  { branche: 'Friseur', year: 2024, median_t: 3.8, p25_t: 1.9, p75_t: 7.2 },
  { branche: 'Zimmerer', year: 2024, median_t: 11.2, p25_t: 5.6, p75_t: 20.4 },
  { branche: 'Dachdecker', year: 2024, median_t: 13.5, p25_t: 6.8, p75_t: 24.2 },
  { branche: 'Maurer/Betonbauer', year: 2024, median_t: 16.8, p25_t: 8.4, p75_t: 29.7 },
  { branche: 'Sonstiges', year: 2024, median_t: 10.0, p25_t: 5.0, p75_t: 18.0 },
];

/**
 * Look up benchmark data for a specific Branche and year.
 *
 * @param branche Trade category to look up.
 * @param year    Reporting year (defaults to 2024).
 * @returns       Benchmark data, or undefined if no data exists for that combination.
 */
export function getBenchmark(branche: Branche, year = 2024): BenchmarkData | undefined {
  return BENCHMARKS_2024.find((b) => b.branche === branche && b.year === year);
}
