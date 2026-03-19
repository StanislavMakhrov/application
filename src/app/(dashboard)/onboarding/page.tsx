/**
 * Onboarding page — first-time setup for new users.
 * Redirects to /energy if company profile already exists.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCompany } from '@/services/companies';
import OnboardingForm from '@/components/forms/OnboardingForm';

export const metadata = {
  title: 'Unternehmen einrichten – GrünBilanz',
};

export default async function OnboardingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // If company already exists, skip onboarding
  const company = await getCompany(session.user.id);
  if (company) {
    redirect('/energy');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Willkommen bei GrünBilanz!
        </h1>
        <p className="text-gray-600 mt-2">
          Bitte richten Sie zunächst Ihr Unternehmensprofil ein, um mit der
          CO₂-Bilanzierung zu beginnen.
        </p>
      </div>
      <OnboardingForm userId={session.user.id} />
    </div>
  );
}
