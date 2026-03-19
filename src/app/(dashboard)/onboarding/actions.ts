/**
 * Server actions for the onboarding form.
 *
 * Kept in a separate file so the page component stays under 300 lines
 * and actions can be unit-tested independently.
 */
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createCompany } from '@/services/companies';
import { BRANCHEN } from '@/lib/benchmarks';

const OnboardingSchema = z.object({
  name: z.string().min(2, 'Firmenname muss mindestens 2 Zeichen haben'),
  branche: z.enum(BRANCHEN),
  mitarbeiter: z.coerce.number().int().min(1, 'Mitarbeiterzahl muss mindestens 1 sein'),
  standort: z.string().min(2, 'Standort muss mindestens 2 Zeichen haben'),
});

export type OnboardingActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function onboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const raw = {
    name: formData.get('name'),
    branche: formData.get('branche'),
    mitarbeiter: formData.get('mitarbeiter'),
    standort: formData.get('standort'),
  };

  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createCompany(parsed.data);
  } catch {
    return { message: 'Fehler beim Speichern. Bitte versuchen Sie es erneut.' };
  }

  redirect('/energy');
}
