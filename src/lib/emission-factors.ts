/**
 * UBA 2024 emission factors for CO₂ calculation.
 *
 * Source: Umweltbundesamt (UBA), "Emissionsfaktoren für die CO₂-Bilanzierung", 2024 edition.
 * These factors follow the GHG Protocol Scope 1 & 2 methodology.
 *
 * Updating factors: change the values here only — no other code changes required.
 * The `year` field allows future versioning when UBA publishes new editions.
 */
export const UBA_2024 = {
  /** German electricity grid emission factor (kg CO₂e per kWh), Scope 2 */
  strom_kwh: 0.380,
  /** Natural gas emission factor (kg CO₂e per m³), Scope 1 */
  erdgas_m3: 2.0,
  /** Diesel fuel emission factor (kg CO₂e per litre), Scope 1 */
  diesel_l: 2.65,
  /** Heating oil emission factor (kg CO₂e per litre), Scope 1 */
  heizoel_l: 2.68,
  /** Publication year of this factor set */
  year: 2024,
} as const;

export type EmissionFactors = typeof UBA_2024;
