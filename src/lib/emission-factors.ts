/**
 * UBA 2024 emission factors for GHG Protocol Scope 1 & 2 calculations.
 * Source: Umweltbundesamt (UBA) 2024, used for German Handwerk CO₂ reporting.
 * These values are immutable constants — never modify without updating the data source reference.
 */
export const UBA_2024 = {
  /** German grid emission factor for electricity (Scope 2) */
  strom_kwh: 0.380,   // kg CO₂/kWh
  /** Natural gas combustion factor (Scope 1) */
  erdgas_m3: 2.0,     // kg CO₂/m³
  /** Diesel combustion factor (Scope 1) */
  diesel_l: 2.65,     // kg CO₂/L
  /** Heating oil combustion factor (Scope 1) */
  heizoel_l: 2.68,    // kg CO₂/L
} as const;
