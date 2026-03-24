/**
 * CO₂e calculation engine for GrünBilanz.
 *
 * All calculations use UBA emission factors from the database (never hardcoded).
 * Amounts are returned in kg CO₂e for single entries and in tonnes CO₂e for
 * year totals, matching GHG Protocol reporting conventions.
 *
 * Special cases:
 * - STROM with isOekostrom=true uses the STROM_OEKOSTROM factor (0.030 kg/kWh)
 * - ABFALL_ALTMETALL has a negative factor (recycling credit), which correctly
 *   reduces the total
 *
 * Monthly billing aggregation rules (Item 4):
 * - If a category has an isFinalAnnual=true entry, use ONLY that entry (it
 *   overrides all monthly entries for the same category)
 * - Otherwise, sum all entries for the category (annual + monthly, across all
 *   providers — e.g. provider changed mid-month)
 *
 * Scope 2 dual-method:
 * - Location-based: always uses the grid factor (STROM), ignoring isOekostrom
 * - Market-based: uses STROM_OEKOSTROM when isOekostrom=true
 * Both values are returned in CO2eTotals; scope2 equals scope2MarketBased.
 */

import { prisma } from './prisma';
import { getEmissionFactor } from './factors';
import type { CO2eTotals } from '@/types';

/**
 * Calculates CO₂e for a single entry in kilograms.
 *
 * @param category - EmissionCategory or MaterialCategory key
 * @param quantity - Amount in the category's native unit
 * @param year - Reporting year for factor lookup
 * @param options - Optional flags (e.g. isOekostrom for STROM)
 * @returns kg CO₂e, or 0 if no factor found
 */
export async function calculateCO2e(
  category: string,
  quantity: number,
  year: number,
  options?: { isOekostrom?: boolean }
): Promise<number> {
  // STROM uses a different factor when powered by renewable energy
  const factorKey =
    category === 'STROM' && options?.isOekostrom ? 'STROM_OEKOSTROM' : category;

  const factor = await getEmissionFactor(factorKey, year);
  if (factor === null) return 0;

  return quantity * factor;
}

/**
 * Calculates total CO₂e in tonnes for a reporting year, broken down by scope.
 *
 * Includes both EmissionEntries and MaterialEntries (materials are Scope 3).
 * Negative factors (e.g. ABFALL_ALTMETALL) are applied as credits.
 *
 * Monthly entry aggregation:
 * - If a category has an isFinalAnnual=true entry, only that entry is counted.
 * - Otherwise all entries for that category are summed (handles multiple
 *   providers and monthly breakdowns simultaneously).
 *
 * @param yearId - Database ID of the ReportingYear
 * @returns Totals in tonnes CO₂e, broken down by scope and category
 */
export async function getTotalCO2e(yearId: number): Promise<CO2eTotals> {
  // Fetch the reporting year to get the calendar year for factor lookup
  const reportingYear = await prisma.reportingYear.findUniqueOrThrow({
    where: { id: yearId },
  });
  const year = reportingYear.year;

  // Fetch all emission entries for this year
  const entries = await prisma.emissionEntry.findMany({
    where: { reportingYearId: yearId },
  });

  // Fetch all material entries for this year
  const materials = await prisma.materialEntry.findMany({
    where: { reportingYearId: yearId },
  });

  const byCategory: Record<string, number> = {};
  let scope1Kg = 0;
  let scope2Kg = 0;
  let scope2LocationKg = 0;
  let scope3Kg = 0;

  // Determine which categories have a final-annual entry — those entries
  // supersede all monthly/provider-specific rows for that category.
  const finalAnnualCategories = new Set(
    entries.filter((e) => e.isFinalAnnual).map((e) => e.category)
  );

  // Process emission entries, skipping non-final rows when a final annual
  // entry exists for the same category.
  for (const entry of entries) {
    // Skip monthly/non-final rows when a definitive annual total exists
    if (finalAnnualCategories.has(entry.category) && !entry.isFinalAnnual) continue;

    const kg = await calculateCO2e(entry.category, entry.quantity, year, {
      isOekostrom: entry.isOekostrom,
    });
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + kg;

    if (entry.scope === 'SCOPE1') scope1Kg += kg;
    else if (entry.scope === 'SCOPE2') {
      scope2Kg += kg;
      // Location-based: always use the grid factor (ignore isOekostrom).
      // Only differs from market-based when isOekostrom=true on a STROM entry;
      // for all other Scope 2 categories the factors are identical.
      if (entry.category === 'STROM' && entry.isOekostrom) {
        const kgLocation = await calculateCO2e(entry.category, entry.quantity, year, {
          isOekostrom: false,
        });
        scope2LocationKg += kgLocation;
      } else {
        scope2LocationKg += kg;
      }
    } else scope3Kg += kg;
  }

  // Process material entries (always Scope 3, Category 1 — upstream emissions)
  for (const mat of materials) {
    const kg = await calculateCO2e(mat.material, mat.quantityKg, year);
    byCategory[mat.material] = (byCategory[mat.material] ?? 0) + kg;
    scope3Kg += kg;
  }

  // Convert kg → tonnes (GHG Protocol reports in t CO₂e)
  const kgToTonnes = (kg: number) => Math.round((kg / 1000) * 1000) / 1000;

  const byCategoryTonnes: Record<string, number> = {};
  for (const [key, kg] of Object.entries(byCategory)) {
    byCategoryTonnes[key] = kgToTonnes(kg);
  }

  return {
    scope1: kgToTonnes(scope1Kg),
    scope2: kgToTonnes(scope2Kg),
    scope2LocationBased: kgToTonnes(scope2LocationKg),
    scope2MarketBased: kgToTonnes(scope2Kg),
    scope3: kgToTonnes(scope3Kg),
    total: kgToTonnes(scope1Kg + scope2Kg + scope3Kg),
    byCategory: byCategoryTonnes,
  };
}
