/**
 * UBA 2024 emission factors (Umweltbundesamt)
 *
 * Source: Umweltbundesamt, "Entwicklung der spezifischen Kohlendioxid-Emissionen des
 * deutschen Strommix in den Jahren 1990 bis 2024", 2024 edition.
 *
 * These are the authoritative German emission factors used for GHG Protocol Scope 1 & 2
 * calculations. They must be updated annually when UBA publishes new values.
 */
export const UBA_2024 = {
  year: 2024,
  // Scope 2: German electricity grid emission factor (kg CO₂/kWh)
  strom_kg_per_kwh: 0.380,
  // Scope 1: Natural gas (kg CO₂/m³)
  erdgas_kg_per_m3: 2.0,
  // Scope 1: Diesel (kg CO₂/L)
  diesel_kg_per_l: 2.65,
  // Scope 1: Heating oil (kg CO₂/L)
  heizoel_kg_per_l: 2.68,
} as const;

export type EmissionFactors = typeof UBA_2024;
