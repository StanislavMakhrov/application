'use client';

/**
 * Screen 1 — Firmenprofil
 * Collects company name, industry, employee count, and location.
 * This data populates PDF headers and the Branchenvergleich benchmark.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { WizardNav } from '@/components/wizard/WizardNav';
import { saveCompanyProfile } from '@/lib/actions';
import { BRANCHE_LABELS } from '@/types';
import type { Branche } from '@/types';
import { PlausibilityWarning, getPlausibilityWarning } from '@/components/wizard/PlausibilityWarning';

const schema = z.object({
  firmenname: z.string().min(1, 'Firmenname ist erforderlich'),
  branche: z.string().min(1, 'Branche ist erforderlich'),
  mitarbeiter: z.coerce
    .number({ invalid_type_error: 'Bitte eine Zahl eingeben' })
    .int('Nur ganze Zahlen')
    .min(1, 'Mindestens 1 Mitarbeiter'),
  standort: z.string().min(1, 'Standort ist erforderlich'),
});

type FormValues = z.infer<typeof schema>;

const BRANCHE_OPTIONS = Object.entries(BRANCHE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function Screen1Firmenprofil() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firmenname: '',
      branche: 'ELEKTROHANDWERK',
      mitarbeiter: 1,
      standort: '',
    },
  });

  const [mitarbeiterWarning, setMitarbeiterWarning] = useState<string | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    fetch('/api/entries?type=profile')
      .then((r) => r.json())
      .then((data) => {
        if (data?.firmenname) {
          setValue('firmenname', data.firmenname);
          setValue('branche', data.branche);
          setValue('mitarbeiter', data.mitarbeiter);
          setValue('standort', data.standort);
        }
      })
      .catch(() => {/* profile may not exist yet */});
  }, [setValue]);

  const onSubmit = async (values: FormValues) => {
    const result = await saveCompanyProfile({
      firmenname: values.firmenname,
      branche: values.branche as Branche,
      mitarbeiter: values.mitarbeiter,
      standort: values.standort,
    });

    if (result.success) {
      toast.success('Firmenprofil gespeichert.');
    } else {
      toast.error(result.error ?? 'Fehler beim Speichern.');
    }
  };

  return (
    <div className="rounded-2xl border border-card-border bg-white p-6 shadow-card">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Firmenprofil</h1>
      <p className="text-sm text-gray-500 mb-6">
        Grunddaten Ihres Betriebs — erscheinen auf dem PDF-Bericht und im Branchenvergleich.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Firmenname */}
        <div className="space-y-1.5">
          <Label htmlFor="firmenname">Firmenname</Label>
          <Input
            id="firmenname"
            placeholder="z.B. Mustermann Elektro GmbH"
            {...register('firmenname')}
          />
          {errors.firmenname && (
            <p className="text-xs text-red-600">{errors.firmenname.message}</p>
          )}
        </div>

        {/* Branche */}
        <div className="space-y-1.5">
          <Label htmlFor="branche">Branche</Label>
          <Select
            id="branche"
            options={BRANCHE_OPTIONS}
            {...register('branche')}
          />
          {errors.branche && (
            <p className="text-xs text-red-600">{errors.branche.message}</p>
          )}
        </div>

        {/* Mitarbeiter */}
        <div className="space-y-1.5">
          <Label htmlFor="mitarbeiter">Anzahl Mitarbeitende (inkl. Inhaber)</Label>
          <Input
            id="mitarbeiter"
            type="number"
            min={1}
            placeholder="z.B. 12"
            {...register('mitarbeiter')}
            onBlur={(e) => setMitarbeiterWarning(getPlausibilityWarning('MITARBEITER', Number(e.target.value)))}
          />
          {errors.mitarbeiter && (
            <p className="text-xs text-red-600">{errors.mitarbeiter.message}</p>
          )}
          <PlausibilityWarning message={mitarbeiterWarning} />
        </div>

        {/* Standort */}
        <div className="space-y-1.5">
          <Label htmlFor="standort">Hauptstandort</Label>
          <Input
            id="standort"
            placeholder="z.B. München, Bayern"
            {...register('standort')}
          />
          {errors.standort && (
            <p className="text-xs text-red-600">{errors.standort.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <WizardNav currentScreen={1} />
    </div>
  );
}
