/**
 * Emission factor lookup from the database.
 *
 * Factors are versioned by `valid_year`. If no factor is found for the
 * requested year, the function falls back to the most recent available year
 * (below or equal to the requested year). This prevents breakage when a new
 * reporting year starts before UBA updates the factors.
 */

import { prisma } from './prisma';

/**
 * Returns the emission factor (kg CO₂e per unit) for a given key and year.
 * Falls back to the most recent factor if the exact year is not available.
 *
 * @param key - Factor key (e.g. 'ERDGAS', 'STROM_OEKOSTROM')
 * @param year - Reporting year (e.g. 2024)
 * @returns Factor value in kg CO₂e per unit, or null if no factor exists
 */
export async function getEmissionFactor(key: string, year: number): Promise<number | null> {
  // First try: exact year match
  const exact = await prisma.emissionFactor.findUnique({
    where: { key_validYear: { key, validYear: year } },
  });
  if (exact) return exact.factorKg;

  // Fallback: most recent factor at or before the requested year
  const fallback = await prisma.emissionFactor.findFirst({
    where: { key, validYear: { lte: year } },
    orderBy: { validYear: 'desc' },
  });

  return fallback?.factorKg ?? null;
}

/**
 * Returns all emission factors for a given year, keyed by factor key.
 * Uses the same year-fallback logic as getEmissionFactor.
 */
export async function getAllFactorsForYear(year: number): Promise<Record<string, number>> {
  // Get all distinct keys available
  const allKeys = await prisma.emissionFactor.findMany({
    select: { key: true },
    distinct: ['key'],
  });

  const result: Record<string, number> = {};
  for (const { key } of allKeys) {
    const factor = await getEmissionFactor(key, year);
    if (factor !== null) {
      result[key] = factor;
    }
  }
  return result;
}
