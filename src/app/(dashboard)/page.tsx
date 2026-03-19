/**
 * Dashboard root — routes the user to the correct first page.
 *
 * If the user has not yet completed onboarding (no company record), they
 * are redirected to the onboarding wizard. Otherwise they land on the
 * energy input page.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCompany } from '@/services/companies';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getCompany();
  if (!company) redirect('/onboarding');

  redirect('/energy');
}
