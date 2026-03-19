/**
 * Emission factor lookup functions for GrünBilanz.
 * Retrieves emission factors from the database (UBA source).
 * All factors are stored in the DB — never hardcoded in application logic.
 */

import { prisma } from './prisma';
import type { EmissionFactor } from '@prisma/client';

/**
 * Retrieves the most recent emission factor for a given year, category, and optional subcategory.
 * Falls back to the previous year if the requested year has no factor.
 *
 * @param year - Reporting year (e.g. 2024)
 * @param category - Emission category (e.g. 'Erdgas', 'Strom', 'Pkw')
 * @param subcategory - Optional sub-category (e.g. 'Diesel', 'Benzin', 'Kurzstrecke')
 * @returns The emission factor record, or null if not found
 */
export async function getEmissionFactor(
  year: number,
  category: string,
  subcategory?: string | null
): Promise<EmissionFactor | null> {
  return prisma.emissionFactor.findFirst({
    where: {
      year,
      category,
      subcategory: subcategory ?? null,
    },
    orderBy: { validFrom: 'desc' },
  });
}

/**
 * Retrieves all emission factors for a given year.
 * Used to pre-populate the input wizard with available categories.
 *
 * @param year - Reporting year
 * @returns Array of all emission factors for that year
 */
export async function getAllEmissionFactors(year: number): Promise<EmissionFactor[]> {
  return prisma.emissionFactor.findMany({
    where: { year },
    orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
  });
}
