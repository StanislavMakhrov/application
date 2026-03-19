/**
 * CO₂ footprint calculator implementing GHG Protocol Scope 1 & 2.
 * Pure function — no I/O, no side effects — safe for server and client use.
 *
 * Formula (UBA 2024):
 *   scope1_t = (erdgas_m3 × 2.0 + diesel_l × 2.65 + heizoel_l × 2.68) ÷ 1000
 *   scope2_t = strom_kwh × 0.380 ÷ 1000
 *   total_t  = scope1_t + scope2_t
 */

export interface CalculationInputs {
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
}

export interface EmissionFactors {
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
}

export interface CalculationResult {
  /** GHG Protocol Scope 1: direct emissions from fuel combustion (tonnes CO₂) */
  scope1_t: number;
  /** GHG Protocol Scope 2: indirect emissions from purchased electricity (tonnes CO₂) */
  scope2_t: number;
  /** Total CO₂ emissions (Scope 1 + Scope 2) in tonnes */
  total_t: number;
}

/**
 * Calculate CO₂ footprint from energy consumption inputs.
 *
 * @param inputs - Annual energy consumption values
 * @param factors - Emission factors (use UBA_2024 for German Handwerk reporting)
 * @returns Scope 1, Scope 2, and total emissions in tonnes CO₂
 */
export function calculateFootprint(
  inputs: CalculationInputs,
  factors: EmissionFactors,
): CalculationResult {
  // Scope 1: direct emissions from fuel combustion (kg → tonnes: ÷ 1000)
  const scope1_kg =
    inputs.erdgas_m3 * factors.erdgas_m3 +
    inputs.diesel_l * factors.diesel_l +
    inputs.heizoel_l * factors.heizoel_l;

  // Scope 2: indirect emissions from purchased electricity (kg → tonnes: ÷ 1000)
  const scope2_kg = inputs.strom_kwh * factors.strom_kwh;

  const scope1_t = scope1_kg / 1000;
  const scope2_t = scope2_kg / 1000;
  const total_t = scope1_t + scope2_t;

  return { scope1_t, scope2_t, total_t };
}
