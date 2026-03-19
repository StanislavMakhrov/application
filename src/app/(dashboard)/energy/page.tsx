/**
 * Energy input page — annual energy consumption data entry.
 * Redirects to onboarding if the company profile doesn't exist yet.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCompany } from '@/services/companies';
import EnergyForm from '@/components/forms/EnergyForm';

export const metadata = {
  title: 'Energiedaten erfassen – GrünBilanz',
};

export default async function EnergyPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const company = await getCompany(session.user.id);

  // Redirect to onboarding if company profile is missing
  if (!company) {
    redirect('/onboarding');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Energiedaten erfassen
        </h1>
        <p className="text-gray-600 mt-2">
          Geben Sie den Energieverbrauch Ihres Betriebs für ein Berichtsjahr ein.
          Der CO₂-Fußabdruck wird automatisch nach GHG-Protokoll (Scope 1 & 2)
          und UBA 2024 Emissionsfaktoren berechnet.
        </p>
      </div>
      <EnergyForm companyId={company.id} />
    </div>
  );
}
