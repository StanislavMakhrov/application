/**
 * Company CRUD operations via Supabase.
 * All operations are scoped to the authenticated user (via user_id).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Company, Branche } from '@/types';

export interface CreateCompanyInput {
  user_id: string;
  name: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
}

/**
 * Fetch the company profile for the current user.
 * Returns null if no profile exists yet.
 */
export async function getCompanyByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') return null; // No rows found
  if (error) throw new Error(`Fehler beim Laden des Unternehmensprofils: ${error.message}`);
  return data as Company;
}

/**
 * Create or update the company profile for the current user (upsert).
 */
export async function upsertCompany(
  supabase: SupabaseClient,
  input: CreateCompanyInput
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .upsert(input, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw new Error(`Fehler beim Speichern des Unternehmensprofils: ${error.message}`);
  return data as Company;
}
