/**
 * Service layer for annual energy entry CRUD operations.
 *
 * Energy entries store raw consumption figures and pre-computed CO₂ values
 * for a given company + year combination. The UNIQUE(company_id, year) database
 * constraint ensures at most one entry per year; upsertEnergyEntry replaces the
 * existing record on conflict.
 */
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type EnergyEntryRow = Database['public']['Tables']['energy_entries']['Row'];
type EnergyEntryInsert = Database['public']['Tables']['energy_entries']['Insert'];

/**
 * Fetch a single energy entry for the given company and reporting year.
 *
 * Returns null when no entry exists (e.g. first-time entry for that year).
 */
export async function getEnergyEntry(
  companyId: string,
  year: number,
): Promise<EnergyEntryRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('energy_entries')
    .select('*')
    .eq('company_id', companyId)
    .eq('year', year)
    .single();
  return data;
}

/**
 * Insert or update the energy entry for a company/year combination.
 *
 * Uses ON CONFLICT (company_id, year) DO UPDATE so that re-submitting the energy
 * form overwrites the existing record rather than creating a duplicate.
 */
export async function upsertEnergyEntry(
  input: Omit<EnergyEntryInsert, 'id' | 'created_at'>,
): Promise<EnergyEntryRow> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('energy_entries')
    .upsert(input, { onConflict: 'company_id,year' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * List all energy entries for a company, ordered newest year first.
 *
 * Used to render year-over-year trend data on the dashboard.
 */
export async function listEnergyEntries(
  companyId: string,
): Promise<EnergyEntryRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('energy_entries')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false });
  return data ?? [];
}
