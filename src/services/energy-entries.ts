/**
 * Energy entry CRUD operations via Supabase.
 * Entries are scoped to a company and stored with pre-calculated CO₂ values.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EnergyEntry } from '@/types';
import { calculateEmissions } from '@/lib/calculator';

export interface CreateEnergyEntryInput {
  company_id: string;
  year: number;
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
}

/**
 * Fetch all energy entries for a company.
 * Returns entries sorted by year descending.
 */
export async function getEnergyEntriesByCompany(
  supabase: SupabaseClient,
  companyId: string
): Promise<EnergyEntry[]> {
  const { data, error } = await supabase
    .from('energy_entries')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false });

  if (error) throw new Error(`Fehler beim Laden der Energiedaten: ${error.message}`);
  return (data ?? []) as EnergyEntry[];
}

/**
 * Fetch a specific year's energy entry for a company.
 * Returns null if no entry exists for that year.
 */
export async function getEnergyEntryByYear(
  supabase: SupabaseClient,
  companyId: string,
  year: number
): Promise<EnergyEntry | null> {
  const { data, error } = await supabase
    .from('energy_entries')
    .select('*')
    .eq('company_id', companyId)
    .eq('year', year)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Fehler beim Laden der Energiedaten: ${error.message}`);
  return data as EnergyEntry;
}

/**
 * Create or update an energy entry with pre-calculated CO₂ values.
 * CO₂ calculation is performed server-side using UBA 2024 emission factors.
 */
export async function upsertEnergyEntry(
  supabase: SupabaseClient,
  input: CreateEnergyEntryInput
): Promise<EnergyEntry> {
  const emissions = calculateEmissions(input);

  const entry = {
    ...input,
    co2_scope1_t: emissions.scope1_t,
    co2_scope2_t: emissions.scope2_t,
    co2_total_t: emissions.total_t,
  };

  const { data, error } = await supabase
    .from('energy_entries')
    .upsert(entry, { onConflict: 'company_id,year' })
    .select()
    .single();

  if (error) throw new Error(`Fehler beim Speichern der Energiedaten: ${error.message}`);
  return data as EnergyEntry;
}
