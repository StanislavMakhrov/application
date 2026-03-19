/**
 * Service layer for company (Betrieb) CRUD operations.
 *
 * Each authenticated user may have exactly one associated company record.
 * RLS on the Supabase `companies` table ensures users can only read/write
 * their own row (user_id = auth.uid()).
 */
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];

/**
 * Retrieve the company record belonging to the currently authenticated user.
 *
 * Returns null if the user is not authenticated or has not yet completed onboarding.
 */
export async function getCompany(): Promise<CompanyRow | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data;
}

/**
 * Create a new company record for the currently authenticated user.
 *
 * Throws if the user is not authenticated or if the database insert fails.
 */
export async function createCompany(
  input: Omit<CompanyInsert, 'user_id' | 'id' | 'created_at'>,
): Promise<CompanyRow> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht authentifiziert');

  const { data, error } = await supabase
    .from('companies')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}
