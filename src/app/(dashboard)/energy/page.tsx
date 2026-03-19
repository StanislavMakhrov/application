import { getUser } from '@/lib/auth';
import { getCompanyByUserId } from '@/services/companies';
import { EnergyForm } from '@/components/forms/EnergyForm';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Energiedaten – GrünBilanz' };

/**
 * Energy data input page.
 * Requires a completed company profile — redirects to /onboarding if missing.
 */
export default async function EnergyPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const company = await getCompanyByUserId(user.id).catch(() => null);
  if (!company) redirect('/onboarding');

  const currentYear = new Date().getFullYear() - 1; // Default to previous calendar year

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">Energiedaten eingeben</h1>
        <p className="text-gray-600 mt-1">
          Tragen Sie Ihren Energieverbrauch für das Berichtsjahr ein.
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <EnergyForm companyId={company.id} defaultYear={currentYear} />
      </div>
    </div>
  );
}
