import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { getCompanyByUserId } from '@/services/companies';
import { EnergyForm } from '@/components/forms/EnergyForm';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Energiedaten – GrünBilanz' };

/**
 * Energy data input page.
 * Requires completed company profile before proceeding.
 */
export default async function EnergyPage() {
  let companyId: string | null = null;
  const currentYear = new Date().getFullYear() - 1; // Default to previous year

  if (!isDemoMode) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const company = await getCompanyByUserId(supabase, session.user.id).catch(() => null);
        if (!company) {
          // Must complete onboarding first
          redirect('/onboarding');
        }
        companyId = company.id;
      }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">Energiedaten eingeben</h1>
        <p className="text-gray-600 mt-1">
          Tragen Sie Ihren Energieverbrauch für das Berichtsjahr ein.
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <EnergyForm companyId={companyId} defaultYear={currentYear} />
      </div>
    </div>
  );
}
