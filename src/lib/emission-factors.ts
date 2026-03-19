/**
 * UBA 2024 emission factors for GHG Protocol Scope 1 & 2 calculations.
 * Source: Umweltbundesamt (UBA), published 2024.
 * Units: kg CO₂ per unit of energy carrier
 */
export const UBA_2024 = {
  /** German electricity grid mix: kg CO₂ per kWh (UBA 2024) */
  strom_kwh: 0.380,
  /** Natural gas: kg CO₂ per m³ */
  erdgas_m3: 2.0,
  /** Diesel fuel: kg CO₂ per litre */
  diesel_l: 2.65,
  /** Heating oil: kg CO₂ per litre */
  heizoel_l: 2.68,
} as const;

export type EmissionFactors = typeof UBA_2024;
