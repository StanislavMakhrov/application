/**
 * Energy entry CRUD operations via Prisma.
 * CO₂ values are calculated server-side on every write using UBA 2024 factors.
 * Maps Prisma's camelCase fields back to the snake_case EnergyEntry domain type.
 */

import { prisma } from '@/lib/prisma';
import type { EnergyEntry } from '@/types';
import { calculateEmissions } from '@/lib/calculator';

export interface CreateEnergyEntryInput {
  company_id: string;
  year: number;
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
}

/** Convert a Prisma EnergyEntry row to the domain EnergyEntry type */
function toEnergyEntry(row: {
  id: string;
  companyId: string;
  year: number;
  stromKwh: number;
  erdgasM3: number;
  dieselL: number;
  heizoelL: number;
  co2Scope1T: number;
  co2Scope2T: number;
  co2TotalT: number;
}): EnergyEntry {
  return {
    id: row.id,
    company_id: row.companyId,
    year: row.year,
    strom_kwh: row.stromKwh,
    erdgas_m3: row.erdgasM3,
    diesel_l: row.dieselL,
    heizoel_l: row.heizoelL,
    co2_scope1_t: row.co2Scope1T,
    co2_scope2_t: row.co2Scope2T,
    co2_total_t: row.co2TotalT,
  };
}

/**
 * Fetch all energy entries for a company, sorted by year descending.
 */
export async function getEnergyEntriesByCompany(companyId: string): Promise<EnergyEntry[]> {
  const rows = await prisma.energyEntry.findMany({
    where: { companyId },
    orderBy: { year: 'desc' },
  });
  return rows.map(toEnergyEntry);
}

/**
 * Fetch a specific year's energy entry for a company.
 * Returns null if no entry exists for that year.
 */
export async function getEnergyEntryByYear(
  companyId: string,
  year: number
): Promise<EnergyEntry | null> {
  const row = await prisma.energyEntry.findUnique({
    where: { companyId_year: { companyId, year } },
  });
  if (!row) return null;
  return toEnergyEntry(row);
}

/**
 * Create or update an energy entry with pre-calculated CO₂ values.
 * CO₂ calculation uses UBA 2024 emission factors via calculateEmissions().
 */
export async function upsertEnergyEntry(input: CreateEnergyEntryInput): Promise<EnergyEntry> {
  const emissions = calculateEmissions(input);
  const row = await prisma.energyEntry.upsert({
    where: { companyId_year: { companyId: input.company_id, year: input.year } },
    create: {
      companyId: input.company_id,
      year: input.year,
      stromKwh: input.strom_kwh,
      erdgasM3: input.erdgas_m3,
      dieselL: input.diesel_l,
      heizoelL: input.heizoel_l,
      co2Scope1T: emissions.scope1_t,
      co2Scope2T: emissions.scope2_t,
      co2TotalT: emissions.total_t,
    },
    update: {
      stromKwh: input.strom_kwh,
      erdgasM3: input.erdgas_m3,
      dieselL: input.diesel_l,
      heizoelL: input.heizoel_l,
      co2Scope1T: emissions.scope1_t,
      co2Scope2T: emissions.scope2_t,
      co2TotalT: emissions.total_t,
    },
  });
  return toEnergyEntry(row);
}
