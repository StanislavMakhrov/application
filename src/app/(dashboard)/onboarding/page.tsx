import { getUser } from '@/lib/auth';
import { getCompanyByUserId } from '@/services/companies';
import { OnboardingForm } from '@/components/forms/OnboardingForm';

export const metadata = { title: 'Unternehmensprofil – GrünBilanz' };

/**
 * Onboarding page: company profile setup.
 * Pre-fills the form with existing data if the user has already completed onboarding.
 */
export default async function OnboardingPage() {
  const user = await getUser();
  const existingCompany = user ? await getCompanyByUserId(user.id).catch(() => null) : null;

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
