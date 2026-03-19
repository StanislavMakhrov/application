/**
 * Energy entry service — data access layer for the EnergyEntry model.
 *
 * Persists annual energy consumption figures together with the calculated
 * CO₂ values (Scope 1, Scope 2, Total). Storing pre-calculated values avoids
 * repeated computation and allows simple reporting queries.
 *
 * Tenant isolation: all operations require a companyId that must already be
 * verified to belong to the authenticated user (enforced at the server action level).
 */
import { prisma } from '@/lib/prisma';
import { calculateFootprint } from '@/lib/calculator';
import { UBA_2024 } from '@/lib/emission-factors';

export interface EnergyEntryInput {
  year: number;
  stromKwh: number;
  erdgasM3: number;
  dieselL: number;
  heizoeL: number;
}

/**
 * Save or update the energy entry for the given company and year.
 * The CO₂ values are calculated here so the stored record is always consistent.
 *
 * @param companyId  UUID of the company (from Company.id)
 * @param data       Annual energy consumption figures from the form
 * @returns          The saved EnergyEntry including calculated CO₂ values
 */
export async function upsertEnergyEntry(companyId: string, data: EnergyEntryInput) {
  const result = calculateFootprint(
    {
      strom_kwh: data.stromKwh,
      erdgas_m3: data.erdgasM3,
      diesel_l: data.dieselL,
      heizoel_l: data.heizoeL,
    },
    UBA_2024,
  );

  return prisma.energyEntry.upsert({
    where: { companyId_year: { companyId, year: data.year } },
    create: {
      companyId,
      year: data.year,
      stromKwh: data.stromKwh,
      erdgasM3: data.erdgasM3,
      dieselL: data.dieselL,
      heizoeL: data.heizoeL,
      co2Scope1T: result.scope1_t,
      co2Scope2T: result.scope2_t,
      co2TotalT: result.total_t,
    },
    update: {
      stromKwh: data.stromKwh,
      erdgasM3: data.erdgasM3,
      dieselL: data.dieselL,
      heizoeL: data.heizoeL,
      co2Scope1T: result.scope1_t,
      co2Scope2T: result.scope2_t,
      co2TotalT: result.total_t,
    },
  });
}

/**
 * Retrieve all energy entries for a company, ordered newest-first.
 *
 * @param companyId  UUID of the company
 */
export async function getEnergyEntriesByCompany(companyId: string) {
  return prisma.energyEntry.findMany({
    where: { companyId },
    orderBy: { year: 'desc' },
  });
}

/**
 * Retrieve the energy entry for a specific company and year.
 * Returns null if no data has been entered for that year.
 *
 * @param companyId  UUID of the company
 * @param year       The year (e.g. 2024)
 */
export async function getEnergyEntryByYear(companyId: string, year: number) {
  return prisma.energyEntry.findUnique({
    where: { companyId_year: { companyId, year } },
  });
}
