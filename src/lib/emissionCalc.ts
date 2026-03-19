/**
 * Emission calculation utilities for GrünBilanz.
 * Provides pure functions for converting activity data to CO₂ equivalents
 * using emission factors from the UBA (Umweltbundesamt).
 */

/**
 * Calculates CO₂ equivalent emissions from activity quantity and emission factor.
 *
 * @param quantity - The amount of activity (e.g. kWh, m³, km, L)
 * @param factorKgCo2ePerUnit - Emission factor in kg CO₂e per unit from UBA
 * @returns CO₂ equivalent in kg CO₂e
 *
 * @example
 * // 1000 kWh of electricity at 0.38 kg CO₂e/kWh = 380 kg CO₂e
 * calculateCo2e(1000, 0.38) // → 380
 */
export function calculateCo2e(quantity: number, factorKgCo2ePerUnit: number): number {
  if (quantity < 0) {
    throw new Error('Menge darf nicht negativ sein');
  }
  if (factorKgCo2ePerUnit < 0) {
    throw new Error('Emissionsfaktor darf nicht negativ sein');
  }
  return quantity * factorKgCo2ePerUnit;
}

/**
 * Converts kg CO₂e to tonnes CO₂e for reporting purposes.
 *
 * @param kgCo2e - CO₂ equivalent in kilograms
 * @returns CO₂ equivalent in tonnes
 */
export function kgToTonnes(kgCo2e: number): number {
  return kgCo2e / 1000;
}

/**
 * Sums an array of CO₂e values in kg and returns the total.
 *
 * @param values - Array of CO₂e values in kg
 * @returns Total CO₂e in kg
 */
export function sumCo2e(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0);
}
