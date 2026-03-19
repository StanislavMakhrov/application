/**
 * Industry benchmark data for GrünBilanz CO₂ comparison.
 *
 * Benchmarks represent anonymised peer data per Branche (trade category).
 * Values are in metric tonnes CO₂e per company per year (normalised for ~10 employees).
 *
 * Data source: Estimated sector averages based on UBA energy-use statistics for
 * German Handwerksbetriebe — to be replaced with actual survey data post-MVP.
 */

/** All supported trade categories (Branchen) in German */
export const BRANCHEN = [
  'Elektrotechnik',
  'Sanitär/Heizung/Klima',
  'Maler/Lackierer',
  'Zimmerer/Dachdecker',
  'Kfz-Handwerk',
  'Bäckerei/Konditorei',
  'Friseur',
  'Tischlerei/Schreiner',
] as const;

export type Branche = (typeof BRANCHEN)[number];

export interface Benchmark {
  branche: Branche;
  year: number;
  /** Median CO₂e in metric tonnes */
  median_t: number;
  /** 25th-percentile CO₂e in metric tonnes */
  p25_t: number;
  /** 75th-percentile CO₂e in metric tonnes */
  p75_t: number;
}

/**
 * 2024 benchmark dataset.
 * Figures are illustrative estimates for the MVP; replace with real survey data.
 */
export const BENCHMARKS_2024: Benchmark[] = [
  {
    branche: 'Elektrotechnik',
    year: 2024,
    median_t: 12.5,
    p25_t: 7.2,
    p75_t: 19.8,
  },
  {
    branche: 'Sanitär/Heizung/Klima',
    year: 2024,
    median_t: 18.3,
    p25_t: 11.0,
    p75_t: 28.5,
  },
  {
    branche: 'Maler/Lackierer',
    year: 2024,
    median_t: 9.6,
    p25_t: 5.8,
    p75_t: 15.4,
  },
  {
    branche: 'Zimmerer/Dachdecker',
    year: 2024,
    median_t: 22.1,
    p25_t: 13.5,
    p75_t: 34.0,
  },
  {
    branche: 'Kfz-Handwerk',
    year: 2024,
    median_t: 31.4,
    p25_t: 19.2,
    p75_t: 47.6,
  },
  {
    branche: 'Bäckerei/Konditorei',
    year: 2024,
    median_t: 45.8,
    p25_t: 28.3,
    p75_t: 68.2,
  },
  {
    branche: 'Friseur',
    year: 2024,
    median_t: 4.2,
    p25_t: 2.5,
    p75_t: 7.1,
  },
  {
    branche: 'Tischlerei/Schreiner',
    year: 2024,
    median_t: 16.7,
    p25_t: 9.8,
    p75_t: 25.3,
  },
];

/**
 * Look up benchmark data for a given Branche and year.
 * Currently only 2024 data is available; returns undefined for other years.
 *
 * @param branche  The trade category
 * @param year     The benchmark year (e.g. 2024)
 * @returns        Benchmark record or undefined if not found
 */
export function getBenchmark(branche: Branche, year: number): Benchmark | undefined {
  return BENCHMARKS_2024.find((b) => b.branche === branche && b.year === year);
}
