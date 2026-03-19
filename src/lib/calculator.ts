/**
 * Pure CO₂ footprint calculation engine — NO I/O, NO side-effects.
 *
 * Implements GHG Protocol Scope 1 & 2 methodology using UBA emission factors.
 * Scope 1: direct combustion emissions (Erdgas, Diesel, Heizöl)
 * Scope 2: indirect electricity emissions (Strom)
 *
 * Results are in metric tonnes CO₂e (t CO₂e).
 */
import type { EmissionFactors } from './emission-factors';

export interface CalculationInputs {
  /** Electricity consumption in kWh */
  strom_kwh: number;
  /** Natural gas consumption in m³ */
  erdgas_m3: number;
  /** Diesel fuel consumption in litres */
  diesel_l: number;
  /** Heating oil consumption in litres */
  heizoel_l: number;
}

export interface CalculationResult {
  /** Scope 1 CO₂e in metric tonnes (direct: gas, diesel, oil) */
  scope1_t: number;
  /** Scope 2 CO₂e in metric tonnes (indirect: electricity) */
  scope2_t: number;
  /** Total CO₂e in metric tonnes (Scope 1 + Scope 2) */
  total_t: number;
}

/**
 * Calculate the CO₂ footprint from annual energy consumption data.
 *
 * Formula (GHG Protocol):
 *   Scope 2 = strom_kwh × strom_factor / 1000
 *   Scope 1 = (erdgas_m3 × erdgas_factor + diesel_l × diesel_factor + heizoel_l × heizoel_factor) / 1000
 *   Total   = Scope 1 + Scope 2
 *
 * @param inputs  Annual energy consumption figures
 * @param factors UBA emission factors (e.g. UBA_2024)
 * @returns       Scope 1, Scope 2, and total CO₂e in metric tonnes
 */
export function calculateFootprint(
  inputs: CalculationInputs,
  factors: EmissionFactors,
): CalculationResult {
  // Scope 2: electricity — divide by 1000 to convert kg → tonnes
  const scope2_t = (inputs.strom_kwh * factors.strom_kwh) / 1000;

  // Scope 1: sum all direct combustion sources, then convert kg → tonnes
  const scope1_t =
    (inputs.erdgas_m3 * factors.erdgas_m3 +
      inputs.diesel_l * factors.diesel_l +
      inputs.heizoel_l * factors.heizoel_l) /
    1000;

  return {
    scope1_t,
    scope2_t,
    total_t: scope1_t + scope2_t,
  };
}
