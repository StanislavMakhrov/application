import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { getCompanyByUserId } from '@/services/companies';
import { OnboardingForm } from '@/components/forms/OnboardingForm';

export const metadata = { title: 'Unternehmensprofil – GrünBilanz' };

/**
 * Onboarding page: company profile setup.
 * Pre-fills form with existing data if profile already exists.
 */
export default async function OnboardingPage() {
  let existingCompany = null;

  if (!isDemoMode) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        existingCompany = await getCompanyByUserId(supabase, session.user.id).catch(() => null);
      }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">Unternehmensprofil</h1>
        <p className="text-gray-600 mt-1">
          Geben Sie Ihre Betriebsdaten ein, um die CO₂-Bilanz zu berechnen.
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <OnboardingForm existingCompany={existingCompany} />
      </div>
    </div>
  );
}
