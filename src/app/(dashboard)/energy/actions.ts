/**
 * Server action for the energy data entry form.
 *
 * Validates input, runs the footprint calculation, and persists the energy
 * entry to the database. Kept separate from the page to respect the 300-line
 * file limit and to allow independent testing.
 */
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCompany } from '@/services/companies';
import { upsertEnergyEntry } from '@/services/energy-entries';
import { calculateFootprint } from '@/lib/calculator';
import { UBA_2024 } from '@/lib/emission-factors';

const EnergySchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2000, 'Jahr muss nach 2000 liegen')
    .max(2100, 'Jahr ungültig'),
  strom_kwh: z.coerce.number().min(0, 'Wert darf nicht negativ sein'),
  erdgas_m3: z.coerce.number().min(0, 'Wert darf nicht negativ sein'),
  diesel_l: z.coerce.number().min(0, 'Wert darf nicht negativ sein'),
  heizoel_l: z.coerce.number().min(0, 'Wert darf nicht negativ sein'),
});

export type EnergyActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function energyAction(
  _prevState: EnergyActionState,
  formData: FormData,
): Promise<EnergyActionState> {
  const raw = {
    year: formData.get('year'),
    strom_kwh: formData.get('strom_kwh'),
    erdgas_m3: formData.get('erdgas_m3'),
    diesel_l: formData.get('diesel_l'),
    heizoel_l: formData.get('heizoel_l'),
  };

  const parsed = EnergySchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const company = await getCompany();
  if (!company) {
    return { message: 'Betrieb nicht gefunden. Bitte schließen Sie zuerst das Onboarding ab.' };
  }

  // Pre-compute CO₂ values so they are stored alongside the raw figures.
  // This avoids re-computation on every results page load.
  const { year, strom_kwh, erdgas_m3, diesel_l, heizoel_l } = parsed.data;
  const result = calculateFootprint(
    { strom_kwh, erdgas_m3, diesel_l, heizoel_l },
    UBA_2024,
  );

  try {
    await upsertEnergyEntry({
      company_id: company.id,
      year,
      strom_kwh,
      erdgas_m3,
      diesel_l,
      heizoel_l,
      co2_scope1_t: result.scope1_t,
      co2_scope2_t: result.scope2_t,
      co2_total_t: result.total_t,
    });
  } catch {
    return { message: 'Fehler beim Speichern. Bitte versuchen Sie es erneut.' };
  }

  redirect(`/results/${year}`);
}
