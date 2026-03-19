/**
 * Company service — CRUD operations for the `companies` table.
 * All operations are scoped to the authenticated user via Supabase RLS.
 */
import { supabase } from '@/lib/supabase';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  branche: string;
  mitarbeiter: number;
  standort: string;
  created_at: string;
}

export interface CreateCompanyData {
  user_id: string;
  name: string;
  branche: string;
  mitarbeiter: number;
  standort: string;
}

export interface UpdateCompanyData {
  name?: string;
  branche?: string;
  mitarbeiter?: number;
  standort?: string;
}

/**
 * Fetch the company profile for a given user.
 * Returns null if no company has been created yet (triggers onboarding redirect).
 */
export async function getCompany(userId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Fehler beim Laden des Unternehmens:', error.message);
    return null;
  }
  return data;
}

/**
 * Create a new company profile for the authenticated user.
 * Should only be called once per user during onboarding.
 */
export async function createCompany(data: CreateCompanyData): Promise<Company | null> {
  const { data: company, error } = await supabase
    .from('companies')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Unternehmens:', error.message);
    return null;
  }
  return company;
}

/**
 * Update an existing company profile.
 *
 * @param id - Company UUID
 * @param updates - Partial fields to update
 */
export async function updateCompany(
  id: string,
  updates: UpdateCompanyData,
): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Unternehmens:', error.message);
    return null;
  }
  return data;
}
