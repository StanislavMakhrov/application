/** Domain model types for GrünBilanz */

export type Branche =
  | 'Elektrotechnik'
  | 'Sanitär/Heizung/Klima'
  | 'Maler/Lackierer'
  | 'Schreiner/Tischler'
  | 'Kfz-Handwerk'
  | 'Bäcker/Konditor'
  | 'Fleischer'
  | 'Friseur'
  | 'Gebäudereinigung'
  | 'Sonstiges';

export const BRANCHEN: Branche[] = [
  'Elektrotechnik',
  'Sanitär/Heizung/Klima',
  'Maler/Lackierer',
  'Schreiner/Tischler',
  'Kfz-Handwerk',
  'Bäcker/Konditor',
  'Fleischer',
  'Friseur',
  'Gebäudereinigung',
  'Sonstiges',
];

export interface Company {
  id: string;
  user_id: string;
  name: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
  created_at?: string;
}

export interface EnergyEntry {
  id: string;
  company_id: string;
  year: number;
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
  co2_scope1_t: number;
  co2_scope2_t: number;
  co2_total_t: number;
  created_at?: string;
}

export interface EmissionResult {
  scope1_t: number;
  scope2_t: number;
  total_t: number;
  breakdown: {
    erdgas_t: number;
    diesel_t: number;
    heizoel_t: number;
    strom_t: number;
  };
}

export interface BenchmarkData {
  branche: Branche;
  /** Median CO₂ tonnes per year for the Branche */
  median_t: number;
  /** 25th percentile */
  p25_t: number;
  /** 75th percentile */
  p75_t: number;
}
