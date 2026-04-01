/**
 * UBA Reference Data — official UBA emission factors for supported years.
 *
 * This module is the single source of truth for UBA factor values used by:
 * - prisma/seed.ts (initial database population)
 * - /api/emission-factors/uba-fill (one-click auto-fill)
 * - /api/emission-factors/years (determining available reference years)
 *
 * All data is statically bundled — no external network calls are made.
 * To add a new year's data, append an entry to UBA_REFERENCE_DATA.
 *
 * Factor values are sourced from UBA (Umweltbundesamt) annual publications:
 * https://www.umweltbundesamt.de/themen/klima-energie/treibhausgas-emissionen
 */

export interface UbaFactor {
  key: string;
  /** German display name shown in the UI and methodology block */
  label: string;
  /** Emission factor in kg CO₂e per unit */
  factorKg: number;
  unit: string;
  /** Source label, e.g. "UBA 2024" — set at definition time */
  source: string;
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
}

/**
 * Official UBA emission factor reference data by year.
 *
 * Keys are calendar years; values are arrays of UbaFactor covering all
 * emission categories tracked by GrünBilanz. Negative factors (e.g.
 * ABFALL_ALTMETALL recycling credit) are valid and intentional.
 */
export const UBA_REFERENCE_DATA: Record<number, UbaFactor[]> = {
  2023: [
    // Scope 1 — Direct energy combustion
    { key: 'ERDGAS', label: 'Erdgas', factorKg: 2.0, unit: 'm³', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'HEIZOEL', label: 'Heizöl', factorKg: 2.65, unit: 'L', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'FLUESSIGGAS', label: 'Flüssiggas (LPG)', factorKg: 1.65, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'DIESEL_FUHRPARK', label: 'Diesel (Fuhrpark)', factorKg: 2.650, unit: 'L', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'BENZIN_FUHRPARK', label: 'Benzin (Fuhrpark)', factorKg: 2.33, unit: 'L', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'PKW_BENZIN_KM', label: 'PKW Benzin (km)', factorKg: 0.142, unit: 'km', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'PKW_DIESEL_KM', label: 'PKW Diesel (km)', factorKg: 0.171, unit: 'km', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'TRANSPORTER_KM', label: 'Transporter (km)', factorKg: 0.21, unit: 'km', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'LKW_KM', label: 'LKW (km)', factorKg: 0.32, unit: 'km', source: 'UBA 2023', scope: 'SCOPE1' },
    // Refrigerant leakage — GWP values from UBA 2023 (same as 2024; IPCC AR5 basis)
    { key: 'R410A_KAELTEMITTEL', label: 'R410A Kältemittel', factorKg: 2088, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'R32_KAELTEMITTEL', label: 'R32 Kältemittel', factorKg: 675, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'R134A_KAELTEMITTEL', label: 'R134A Kältemittel', factorKg: 1430, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE1' },
    { key: 'SONSTIGE_KAELTEMITTEL', label: 'Sonstige Kältemittel', factorKg: 1000, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE1' },
    // Scope 2 — Purchased electricity and district heating
    // UBA grid emission factor for 2023 (434 g CO₂e/kWh)
    { key: 'STROM', label: 'Strom (Netzstrom)', factorKg: 0.434, unit: 'kWh', source: 'UBA 2023', scope: 'SCOPE2' },
    { key: 'STROM_OEKOSTROM', label: 'Strom (Ökostrom)', factorKg: 0.03, unit: 'kWh', source: 'UBA 2023', scope: 'SCOPE2' },
    { key: 'FERNWAERME', label: 'Fernwärme', factorKg: 0.175, unit: 'kWh', source: 'UBA 2023', scope: 'SCOPE2' },
    // Scope 3 — Upstream and downstream activities
    { key: 'GESCHAEFTSREISEN_FLUG', label: 'Geschäftsreisen Flug', factorKg: 0.255, unit: 'km', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'GESCHAEFTSREISEN_BAHN', label: 'Geschäftsreisen Bahn', factorKg: 0.032, unit: 'km', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'PENDLERVERKEHR', label: 'Pendlerverkehr', factorKg: 0.142, unit: 'km', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'ABFALL_RESTMUELL', label: 'Abfall Restmüll', factorKg: 0.45, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'ABFALL_BAUSCHUTT', label: 'Abfall Bauschutt', factorKg: 0.008, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    // Negative factor: recycling credit (Gutschrift) reduces total CO₂e
    { key: 'ABFALL_ALTMETALL', label: 'Abfall Altmetall (Recycling)', factorKg: -1.5, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'ABFALL_SONSTIGES', label: 'Abfall Sonstiges', factorKg: 0.35, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    // Material upstream emissions (Scope 3, Category 1)
    { key: 'KUPFER', label: 'Kupfer', factorKg: 3.8, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'STAHL', label: 'Stahl', factorKg: 1.77, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'ALUMINIUM', label: 'Aluminium', factorKg: 8.24, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'HOLZ', label: 'Holz', factorKg: 0.47, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'KUNSTSTOFF_PVC', label: 'Kunststoff / PVC', factorKg: 2.41, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'BETON', label: 'Beton', factorKg: 0.13, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'FARBEN_LACKE', label: 'Farben & Lacke', factorKg: 2.8, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
    { key: 'SONSTIGE', label: 'Sonstige Materialien', factorKg: 1.0, unit: 'kg', source: 'UBA 2023', scope: 'SCOPE3' },
  ],

  2024: [
    // Scope 1 — Direct energy combustion (same values as 2023 where unchanged)
    { key: 'ERDGAS', label: 'Erdgas', factorKg: 2.0, unit: 'm³', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'HEIZOEL', label: 'Heizöl', factorKg: 2.65, unit: 'L', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'FLUESSIGGAS', label: 'Flüssiggas (LPG)', factorKg: 1.65, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'DIESEL_FUHRPARK', label: 'Diesel (Fuhrpark)', factorKg: 2.650, unit: 'L', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'BENZIN_FUHRPARK', label: 'Benzin (Fuhrpark)', factorKg: 2.33, unit: 'L', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'PKW_BENZIN_KM', label: 'PKW Benzin (km)', factorKg: 0.142, unit: 'km', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'PKW_DIESEL_KM', label: 'PKW Diesel (km)', factorKg: 0.171, unit: 'km', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'TRANSPORTER_KM', label: 'Transporter (km)', factorKg: 0.21, unit: 'km', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'LKW_KM', label: 'LKW (km)', factorKg: 0.32, unit: 'km', source: 'UBA 2024', scope: 'SCOPE1' },
    // Refrigerant leakage — GWP values from UBA 2024 (IPCC AR5 basis)
    { key: 'R410A_KAELTEMITTEL', label: 'R410A Kältemittel', factorKg: 2088, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'R32_KAELTEMITTEL', label: 'R32 Kältemittel', factorKg: 675, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'R134A_KAELTEMITTEL', label: 'R134A Kältemittel', factorKg: 1430, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE1' },
    { key: 'SONSTIGE_KAELTEMITTEL', label: 'Sonstige Kältemittel', factorKg: 1000, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE1' },
    // Scope 2 — Updated grid factor for 2024 (380 g CO₂e/kWh, down from 434)
    { key: 'STROM', label: 'Strom (Netzstrom)', factorKg: 0.380, unit: 'kWh', source: 'UBA 2024', scope: 'SCOPE2' },
    { key: 'STROM_OEKOSTROM', label: 'Strom (Ökostrom)', factorKg: 0.03, unit: 'kWh', source: 'UBA 2024', scope: 'SCOPE2' },
    { key: 'FERNWAERME', label: 'Fernwärme', factorKg: 0.175, unit: 'kWh', source: 'UBA 2024', scope: 'SCOPE2' },
    // Scope 3
    { key: 'GESCHAEFTSREISEN_FLUG', label: 'Geschäftsreisen Flug', factorKg: 0.255, unit: 'km', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'GESCHAEFTSREISEN_BAHN', label: 'Geschäftsreisen Bahn', factorKg: 0.032, unit: 'km', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'PENDLERVERKEHR', label: 'Pendlerverkehr', factorKg: 0.142, unit: 'km', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'ABFALL_RESTMUELL', label: 'Abfall Restmüll', factorKg: 0.45, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'ABFALL_BAUSCHUTT', label: 'Abfall Bauschutt', factorKg: 0.008, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'ABFALL_ALTMETALL', label: 'Abfall Altmetall (Recycling)', factorKg: -1.5, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'ABFALL_SONSTIGES', label: 'Abfall Sonstiges', factorKg: 0.35, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    // Material upstream emissions (Scope 3, Category 1)
    { key: 'KUPFER', label: 'Kupfer', factorKg: 3.8, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'STAHL', label: 'Stahl', factorKg: 1.77, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'ALUMINIUM', label: 'Aluminium', factorKg: 8.24, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'HOLZ', label: 'Holz', factorKg: 0.47, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'KUNSTSTOFF_PVC', label: 'Kunststoff / PVC', factorKg: 2.41, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'BETON', label: 'Beton', factorKg: 0.13, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'FARBEN_LACKE', label: 'Farben & Lacke', factorKg: 2.8, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
    { key: 'SONSTIGE', label: 'Sonstige Materialien', factorKg: 1.0, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE3' },
  ],
};

/**
 * Returns the list of years for which built-in UBA reference data exists,
 * sorted ascending. Used by the API to determine auto-fill eligibility.
 */
export function getUbaReferenceYears(): number[] {
  return Object.keys(UBA_REFERENCE_DATA).map(Number).sort((a, b) => a - b);
}
