/**
 * Energy entries service — CRUD for the `energy_entries` table.
 * CO₂ values (scope1, scope2, total) are calculated and stored on save
 * so that results pages can render without recalculating.
 */
import { supabase } from '@/lib/supabase';
import { calculateFootprint } from '@/lib/calculator';
import { UBA_2024 } from '@/lib/emission-factors';

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
  created_at: string;
}

export interface SaveEnergyEntryData {
  company_id: string;
  year: number;
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
}

/**
 * Fetch a single energy entry for a company + year combination.
 * Returns null if no entry exists yet for that year.
 */
export async function getEnergyEntry(
  companyId: string,
  year: number,
): Promise<EnergyEntry | null> {
  const { data, error } = await supabase
    .from('energy_entries')
    .select('*')
    .eq('company_id', companyId)
    .eq('year', year)
    .maybeSingle();

  if (error) {
    console.error('Fehler beim Laden des Energieeintrags:', error.message);
    return null;
  }
  return data;
}

/**
 * Save (upsert) an energy entry and compute CO₂ values using UBA 2024 factors.
 * Uses upsert so users can correct their data for a given year.
 */
export async function saveEnergyEntry(
  entryData: SaveEnergyEntryData,
): Promise<EnergyEntry | null> {
  // Calculate CO₂ using GHG Protocol formulas before persisting
  const result = calculateFootprint(
    {
      strom_kwh: entryData.strom_kwh,
      erdgas_m3: entryData.erdgas_m3,
      diesel_l: entryData.diesel_l,
      heizoel_l: entryData.heizoel_l,
    },
    UBA_2024,
  );

  const record = {
    ...entryData,
    co2_scope1_t: result.scope1_t,
    co2_scope2_t: result.scope2_t,
    co2_total_t: result.total_t,
  };

  const { data, error } = await supabase
    .from('energy_entries')
    .upsert(record, { onConflict: 'company_id,year' })
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Speichern des Energieeintrags:', error.message);
    return null;
  }
  return data;
}

/**
 * List all energy entries for a company, ordered by year descending.
 * Used for the dashboard overview and history view.
 */
export async function listEnergyEntries(companyId: string): Promise<EnergyEntry[]> {
  const { data, error } = await supabase
    .from('energy_entries')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Energieeinträge:', error.message);
    return [];
  }
  return data ?? [];
}
