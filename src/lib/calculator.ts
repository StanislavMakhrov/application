/**
 * Pure CO₂ footprint calculator following GHG Protocol Scope 1 & 2 methodology.
 *
 * Scope 1: Direct emissions from combustion of fossil fuels on-site (Erdgas, Diesel, Heizöl).
 * Scope 2: Indirect emissions from purchased electricity (Strom).
 *
 * Results are rounded to two decimal places to match typical reporting precision.
 */
import type { EmissionFactors } from './emission-factors';

export interface EnergyInputs {
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
}

export interface FootprintResult {
  scope1_t: number;
  scope2_t: number;
  total_t: number;
}

/**
 * Calculate CO₂ footprint in tonnes from energy consumption inputs.
 *
 * @param inputs  Annual energy consumption values per energy carrier.
 * @param factors Emission factors to apply (use UBA_2024 for current year).
 * @returns       Scope 1, Scope 2 and total CO₂ in metric tonnes.
 */
export function calculateFootprint(
  inputs: EnergyInputs,
  factors: EmissionFactors,
): FootprintResult {
  // Scope 1: direct combustion — natural gas, diesel, heating oil
  const scope1_kg =
    inputs.erdgas_m3 * factors.erdgas_kg_per_m3 +
    inputs.diesel_l * factors.diesel_kg_per_l +
    inputs.heizoel_l * factors.heizoel_kg_per_l;

  // Scope 2: location-based indirect emissions from purchased electricity
  const scope2_kg = inputs.strom_kwh * factors.strom_kg_per_kwh;

  return {
    scope1_t: Math.round((scope1_kg / 1000) * 100) / 100,
    scope2_t: Math.round((scope2_kg / 1000) * 100) / 100,
    total_t: Math.round(((scope1_kg + scope2_kg) / 1000) * 100) / 100,
  };
}
