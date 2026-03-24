/**
 * Shared TypeScript types for GrünBilanz.
 * These mirror the Prisma enums and models but are available on the client side.
 */

// === Enums (must match Prisma schema exactly) ===

export type Scope = 'SCOPE1' | 'SCOPE2' | 'SCOPE3';

export type EmissionCategory =
  | 'ERDGAS'
  | 'HEIZOEL'
  | 'FLUESSIGGAS'
  | 'DIESEL_FUHRPARK'
  | 'BENZIN_FUHRPARK'
  | 'PKW_BENZIN_KM'
  | 'PKW_DIESEL_KM'
  | 'TRANSPORTER_KM'
  | 'LKW_KM'
  | 'STROM'
  | 'FERNWAERME'
  | 'GESCHAEFTSREISEN_FLUG'
  | 'GESCHAEFTSREISEN_BAHN'
  | 'PENDLERVERKEHR'
  | 'ABFALL_RESTMUELL'
  | 'ABFALL_BAUSCHUTT'
  | 'ABFALL_ALTMETALL'
  | 'ABFALL_SONSTIGES'
  | 'R410A_KAELTEMITTEL'
  | 'R32_KAELTEMITTEL'
  | 'R134A_KAELTEMITTEL'
  | 'SONSTIGE_KAELTEMITTEL';

export type MaterialCategory =
  | 'KUPFER'
  | 'STAHL'
  | 'ALUMINIUM'
  | 'HOLZ'
  | 'KUNSTSTOFF_PVC'
  | 'BETON'
  | 'FARBEN_LACKE'
  | 'SONSTIGE';

export type Branche =
  | 'ELEKTROHANDWERK'
  | 'SHK'
  | 'BAUGEWERBE'
  | 'TISCHLER'
  | 'KFZ_WERKSTATT'
  | 'MALER'
  | 'SONSTIGES';

export type InputMethod = 'MANUAL' | 'OCR' | 'CSV';

export type ReportType = 'GHG_PROTOCOL' | 'CSRD_QUESTIONNAIRE';

// === Data Transfer Objects ===

export interface CompanyProfileData {
  id: number;
  firmenname: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
  logoPath?: string | null;
}

export interface EmissionEntryData {
  id: number;
  reportingYearId: number;
  scope: Scope;
  category: EmissionCategory;
  quantity: number;
  memo?: string | null;
  isOekostrom: boolean;
  inputMethod: InputMethod;
}

export interface MaterialEntryData {
  id: number;
  reportingYearId: number;
  material: MaterialCategory;
  quantityKg: number;
  supplierName?: string | null;
  inputMethod: InputMethod;
}

export interface ReportingYearData {
  id: number;
  year: number;
}

// === Calculation Results ===

export interface CO2eTotals {
  scope1: number; // tonnes
  scope2: number; // tonnes
  scope3: number; // tonnes
  total: number; // tonnes
  byCategory: Record<string, number>; // tonnes
}

// === UI Helpers ===

/** Human-readable German label for each emission category */
export const CATEGORY_LABELS: Record<EmissionCategory, string> = {
  ERDGAS: 'Erdgas',
  HEIZOEL: 'Heizöl',
  FLUESSIGGAS: 'Flüssiggas',
  DIESEL_FUHRPARK: 'Diesel (Fuhrpark)',
  BENZIN_FUHRPARK: 'Benzin (Fuhrpark)',
  PKW_BENZIN_KM: 'PKW Benzin (km)',
  PKW_DIESEL_KM: 'PKW Diesel (km)',
  TRANSPORTER_KM: 'Transporter (km)',
  LKW_KM: 'LKW (km)',
  STROM: 'Strom',
  FERNWAERME: 'Fernwärme',
  GESCHAEFTSREISEN_FLUG: 'Geschäftsreisen Flug',
  GESCHAEFTSREISEN_BAHN: 'Geschäftsreisen Bahn',
  PENDLERVERKEHR: 'Pendlerverkehr',
  ABFALL_RESTMUELL: 'Abfall Restmüll',
  ABFALL_BAUSCHUTT: 'Abfall Bauschutt',
  ABFALL_ALTMETALL: 'Abfall Altmetall',
  ABFALL_SONSTIGES: 'Abfall Sonstiges',
  R410A_KAELTEMITTEL: 'R410A (Kältemittelverlust)',
  R32_KAELTEMITTEL: 'R32 (Kältemittelverlust)',
  R134A_KAELTEMITTEL: 'R134a (Kältemittelverlust)',
  SONSTIGE_KAELTEMITTEL: 'Sonstige Kältemittel',
};

/** Human-readable German label for each material category */
export const MATERIAL_LABELS: Record<MaterialCategory, string> = {
  KUPFER: 'Kupfer',
  STAHL: 'Stahl',
  ALUMINIUM: 'Aluminium',
  HOLZ: 'Holz',
  KUNSTSTOFF_PVC: 'Kunststoff / PVC',
  BETON: 'Beton',
  FARBEN_LACKE: 'Farben & Lacke',
  SONSTIGE: 'Sonstige Materialien',
};

/** Human-readable German label for each Branche */
export const BRANCHE_LABELS: Record<Branche, string> = {
  ELEKTROHANDWERK: 'Elektrohandwerk',
  SHK: 'SHK (Sanitär/Heizung/Klima)',
  BAUGEWERBE: 'Baugewerbe',
  TISCHLER: 'Tischler / Schreiner',
  KFZ_WERKSTATT: 'KFZ-Werkstatt',
  MALER: 'Maler & Lackierer',
  SONSTIGES: 'Sonstiges Handwerk',
};

/** Unit labels for each emission category */
export const CATEGORY_UNITS: Record<EmissionCategory, string> = {
  ERDGAS: 'm³',
  HEIZOEL: 'L',
  FLUESSIGGAS: 'kg',
  DIESEL_FUHRPARK: 'L',
  BENZIN_FUHRPARK: 'L',
  PKW_BENZIN_KM: 'km',
  PKW_DIESEL_KM: 'km',
  TRANSPORTER_KM: 'km',
  LKW_KM: 'km',
  STROM: 'kWh',
  FERNWAERME: 'kWh',
  GESCHAEFTSREISEN_FLUG: 'km',
  GESCHAEFTSREISEN_BAHN: 'km',
  PENDLERVERKEHR: 'km',
  ABFALL_RESTMUELL: 'kg',
  ABFALL_BAUSCHUTT: 'kg',
  ABFALL_ALTMETALL: 'kg',
  ABFALL_SONSTIGES: 'kg',
  R410A_KAELTEMITTEL: 'kg',
  R32_KAELTEMITTEL: 'kg',
  R134A_KAELTEMITTEL: 'kg',
  SONSTIGE_KAELTEMITTEL: 'kg',
};

/**
 * GHG Protocol Corporate Standard — Scope 3 category numbers for each emission category.
 * Only Scope 3 categories are listed here; Scope 1/2 entries do not have Protocol category numbers.
 * Materials (Scope 3 Category 1) are tracked separately as MaterialEntries.
 */
export const SCOPE3_GHG_PROTOCOL_CATEGORY: Partial<Record<EmissionCategory, string>> = {
  ABFALL_RESTMUELL: 'Kat. 5',
  ABFALL_BAUSCHUTT: 'Kat. 5',
  ABFALL_ALTMETALL: 'Kat. 5',
  ABFALL_SONSTIGES: 'Kat. 5',
  GESCHAEFTSREISEN_FLUG: 'Kat. 6',
  GESCHAEFTSREISEN_BAHN: 'Kat. 6',
  PENDLERVERKEHR: 'Kat. 7',
};

/** Maps each emission category to its scope */
export const CATEGORY_SCOPE: Record<EmissionCategory, Scope> = {
  ERDGAS: 'SCOPE1',
  HEIZOEL: 'SCOPE1',
  FLUESSIGGAS: 'SCOPE1',
  DIESEL_FUHRPARK: 'SCOPE1',
  BENZIN_FUHRPARK: 'SCOPE1',
  PKW_BENZIN_KM: 'SCOPE1',
  PKW_DIESEL_KM: 'SCOPE1',
  TRANSPORTER_KM: 'SCOPE1',
  LKW_KM: 'SCOPE1',
  STROM: 'SCOPE2',
  FERNWAERME: 'SCOPE2',
  GESCHAEFTSREISEN_FLUG: 'SCOPE3',
  GESCHAEFTSREISEN_BAHN: 'SCOPE3',
  PENDLERVERKEHR: 'SCOPE3',
  ABFALL_RESTMUELL: 'SCOPE3',
  ABFALL_BAUSCHUTT: 'SCOPE3',
  ABFALL_ALTMETALL: 'SCOPE3',
  ABFALL_SONSTIGES: 'SCOPE3',
  R410A_KAELTEMITTEL: 'SCOPE1',
  R32_KAELTEMITTEL: 'SCOPE1',
  R134A_KAELTEMITTEL: 'SCOPE1',
  SONSTIGE_KAELTEMITTEL: 'SCOPE1',
};
