/**
 * Onboarding page — company profile setup.
 *
 * Fetches existing company data (if any) and renders the OnboardingForm.
 * The `saveCompany` Server Action is defined here to keep the data flow clear.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { upsertCompany, getCompanyByUserId } from '@/services/companies';
import { BRANCHEN, type Branche } from '@/lib/benchmarks';
import OnboardingForm from '@/components/forms/OnboardingForm';
import { z } from 'zod';

// Zod schema for server-side validation of the onboarding form
const OnboardingSchema = z.object({
  name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  branche: z.enum([...BRANCHEN] as [Branche, ...Branche[]], {
    errorMap: () => ({ message: 'Bitte eine gültige Branche wählen' }),
  }),
  mitarbeiter: z.coerce.number().int().min(1).max(9999),
  standort: z.string().min(1, 'Standort ist erforderlich').max(100),
});

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getCompanyByUserId(user.id);

  /** Server Action — saves company data and returns an error if validation fails */
  async function saveCompany(formData: FormData): Promise<{ error?: string }> {
    'use server';

    const supabaseInner = await createServerSupabaseClient();
    const {
      data: { user: currentUser },
    } = await supabaseInner.auth.getUser();

    if (!currentUser) return { error: 'Nicht angemeldet' };

    const parsed = OnboardingSchema.safeParse({
      name: formData.get('name'),
      branche: formData.get('branche'),
      mitarbeiter: formData.get('mitarbeiter'),
      standort: formData.get('standort'),
    });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return { error: firstError?.message ?? 'Ungültige Eingabe' };
    }

    await upsertCompany(currentUser.id, parsed.data);
    return {};
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Unternehmensprofil</h1>
        <p className="mt-1 text-sm text-gray-500">
          {company
            ? 'Aktualisieren Sie Ihre Unternehmensdaten.'
            : 'Richten Sie Ihr Unternehmensprofil ein, um zu beginnen.'}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <OnboardingForm
          initialData={
            company
              ? {
                  name: company.name,
                  branche: company.branche as Branche,
                  mitarbeiter: company.mitarbeiter,
                  standort: company.standort,
                }
              : undefined
          }
          saveCompany={saveCompany}
        />
      </div>
    </div>
  );
}
