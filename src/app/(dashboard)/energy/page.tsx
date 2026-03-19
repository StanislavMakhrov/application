/**
 * Energy input page — annual energy consumption data entry.
 *
 * Fetches the company profile to confirm onboarding is complete.
 * If not, redirects to /onboarding. Otherwise renders EnergyForm.
 * The `saveEnergyEntry` Server Action validates, calculates, and persists CO₂ data.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getCompanyByUserId } from '@/services/companies';
import { upsertEnergyEntry } from '@/services/energy-entries';
import EnergyForm from '@/components/forms/EnergyForm';
import { z } from 'zod';

// Zod schema for server-side validation of the energy form
const EnergySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  stromKwh: z.coerce.number().min(0),
  erdgasM3: z.coerce.number().min(0),
  dieselL: z.coerce.number().min(0),
  heizoeL: z.coerce.number().min(0),
});

export default async function EnergyPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getCompanyByUserId(user.id);
  if (!company) redirect('/onboarding');

  /** Server Action — validates energy data, calculates CO₂, and saves the entry */
  async function saveEnergyEntry(
    formData: FormData,
  ): Promise<{ error?: string; year?: number }> {
    'use server';

    const supabaseInner = await createServerSupabaseClient();
    const {
      data: { user: currentUser },
    } = await supabaseInner.auth.getUser();

    if (!currentUser) return { error: 'Nicht angemeldet' };

    const currentCompany = await getCompanyByUserId(currentUser.id);
    if (!currentCompany) return { error: 'Unternehmensprofil nicht gefunden' };

    const parsed = EnergySchema.safeParse({
      year: formData.get('year'),
      stromKwh: formData.get('stromKwh'),
      erdgasM3: formData.get('erdgasM3'),
      dieselL: formData.get('dieselL'),
      heizoeL: formData.get('heizoeL'),
    });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return { error: firstError?.message ?? 'Ungültige Eingabe' };
    }

    await upsertEnergyEntry(currentCompany.id, parsed.data);
    return { year: parsed.data.year };
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Energieverbrauch erfassen</h1>
        <p className="mt-1 text-sm text-gray-500">
          Geben Sie den jährlichen Energieverbrauch Ihres Betriebs ein. Wir berechnen
          automatisch den CO₂-Fußabdruck nach GHG-Protocol.
        </p>
      </div>

      {/* Scope explanation card */}
      <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
        <p className="font-medium">Methodik: GHG Protocol Scope 1 &amp; 2</p>
        <p className="mt-1 text-green-700">
          Scope 1 = direkte Emissionen (Erdgas, Diesel, Heizöl) ·
          Scope 2 = Strom aus dem Netz
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <EnergyForm saveEnergyEntry={saveEnergyEntry} />
      </div>
    </div>
  );
}
