/**
 * Benchmark data for German Handwerk sectors.
 * Values represent typical annual CO₂ emissions (tonnes) per company.
 *
 * Sources: Industry averages derived from German energy statistics and
 * sector-specific energy intensity data (BMWi Handwerk-Energiebericht 2023).
 * Energy-intensive sectors (Bäcker, Fleischer) have significantly higher benchmarks
 * due to process heat requirements.
 */

export const BRANCHEN = [
  'Elektrotechnik',
  'Sanitär/Heizung/Klima',
  'Maler/Lackierer',
  'Tischler/Schreiner',
  'Kfz-Mechaniker',
  'Bäcker',
  'Fleischer',
  'Dachdecker',
  'Maurer/Betonbauer',
  'Sonstige',
] as const;

export type Branche = (typeof BRANCHEN)[number];

export interface Benchmark {
  /** Median CO₂ emissions in tonnes per year for this sector */
  median_t: number;
  /** 25th percentile — companies below this are low-emitters */
  p25_t: number;
  /** 75th percentile — companies above this are high-emitters */
  p75_t: number;
}

/**
 * Sector benchmark lookup map.
 * All values in tonnes CO₂/year for a typical German Handwerksbetrieb.
 */
const BENCHMARK_DATA: Record<Branche, Benchmark> = {
  // Low energy use: mostly office + vehicles, minimal process heat
  'Elektrotechnik': { median_t: 8.5, p25_t: 4.2, p75_t: 14.0 },
  // Service-intensive: heating systems, gas usage for demos
  'Sanitär/Heizung/Klima': { median_t: 12.0, p25_t: 6.5, p75_t: 20.0 },
  // Low process energy: solvent emissions excluded from Scope 1/2
  'Maler/Lackierer': { median_t: 6.0, p25_t: 3.0, p75_t: 10.5 },
  // Workshop machinery + drying/heating = moderate energy demand
  'Tischler/Schreiner': { median_t: 15.0, p25_t: 8.0, p75_t: 24.0 },
  // Vehicle lifts, air compressors, heating = moderate electricity use
  'Kfz-Mechaniker': { median_t: 18.0, p25_t: 9.5, p75_t: 28.0 },
  // High process heat (ovens 200–300°C), early morning shifts = high energy
  'Bäcker': { median_t: 45.0, p25_t: 28.0, p75_t: 68.0 },
  // Refrigeration + process heat for cooking = high energy demand
  'Fleischer': { median_t: 38.0, p25_t: 22.0, p75_t: 58.0 },
  // Outdoor work, low workshop energy use
  'Dachdecker': { median_t: 7.5, p25_t: 3.8, p75_t: 13.0 },
  // Heavy machinery, concrete mixing = significant diesel + electricity
  'Maurer/Betonbauer': { median_t: 22.0, p25_t: 12.0, p75_t: 36.0 },
  // Broad category: use mid-range defaults
  'Sonstige': { median_t: 14.0, p25_t: 7.0, p75_t: 22.0 },
};

/**
 * Return benchmark data for a given Branche (sector).
 * Falls back to 'Sonstige' for unknown sector names.
 *
 * @param branche - Sector name (should match BRANCHEN list)
 * @returns Benchmark with median, p25, p75 in tonnes CO₂/year
 */
export function getBenchmark(branche: string): Benchmark {
  const data = BENCHMARK_DATA[branche as Branche];
  // Fall back to 'Sonstige' if the sector is not found in our data
  return data ?? BENCHMARK_DATA['Sonstige'];
}
