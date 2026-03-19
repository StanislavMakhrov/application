/**
 * Pure CO₂ calculation engine for GrünBilanz.
 * Implements GHG Protocol Scope 1 & 2 methodology using UBA 2024 factors.
 * All results are in metric tonnes of CO₂ equivalent (t CO₂e).
 */

import { UBA_2024 } from './emission-factors';
import type { EmissionResult } from '@/types';

export interface EnergyInputs {
  /** Electricity consumption in kWh */
  strom_kwh: number;
  /** Natural gas consumption in m³ */
  erdgas_m3: number;
  /** Diesel consumption in litres */
  diesel_l: number;
  /** Heating oil consumption in litres */
  heizoel_l: number;
}

/**
 * Calculate CO₂ emissions from energy consumption data.
 *
 * Scope 1: Direct emissions from on-site combustion (Erdgas, Diesel, Heizöl)
 * Scope 2: Indirect emissions from purchased electricity
 *
 * @param inputs - Annual energy consumption values
 * @returns Emission totals and breakdown in tonnes CO₂e
 */
export function calculateEmissions(inputs: EnergyInputs): EmissionResult {
  const { strom_kwh, erdgas_m3, diesel_l, heizoel_l } = inputs;

  // Scope 1: on-site combustion — convert kg to tonnes (÷ 1000)
  const erdgas_t = (erdgas_m3 * UBA_2024.erdgas_m3) / 1000;
  const diesel_t = (diesel_l * UBA_2024.diesel_l) / 1000;
  const heizoel_t = (heizoel_l * UBA_2024.heizoel_l) / 1000;
  const scope1_t = erdgas_t + diesel_t + heizoel_t;

  // Scope 2: electricity from the German grid
  const strom_t = (strom_kwh * UBA_2024.strom_kwh) / 1000;
  const scope2_t = strom_t;

  const total_t = scope1_t + scope2_t;

  return {
    scope1_t: roundTo3(scope1_t),
    scope2_t: roundTo3(scope2_t),
    total_t: roundTo3(total_t),
    breakdown: {
      erdgas_t: roundTo3(erdgas_t),
      diesel_t: roundTo3(diesel_t),
      heizoel_t: roundTo3(heizoel_t),
      strom_t: roundTo3(strom_t),
    },
  };
}

/** Round to 3 decimal places to avoid floating-point noise */
function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
