'use client';

/**
 * FirmenprofilSettings — editable company-profile form for the Settings page.
 *
 * Extracted from Screen1Firmenprofil so that company-wide data (Firmenname,
 * Branche, etc.) can be managed from a permanent, predictable location rather
 * than from inside the year-specific data-entry wizard.
 * See: docs/features/001-company-settings-ui/architecture.md
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
import { saveCompanyProfile } from '@/lib/actions';
import { BRANCHE_LABELS } from '@/types';
import type { Branche } from '@/types';

const schema = z.object({
  firmenname: z.string().min(1, 'Firmenname ist erforderlich'),
  branche: z.string().min(1, 'Branche ist erforderlich'),
  mitarbeiter: z.coerce
    .number({ invalid_type_error: 'Bitte eine Zahl eingeben' })
    .int('Nur ganze Zahlen')
    .min(1, 'Mindestens 1 Mitarbeiter'),
  standort: z.string().min(1, 'Standort ist erforderlich'),
  reportingBoundaryNotes: z.string().optional(),
  exclusions: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const BRANCHE_OPTIONS = Object.entries(BRANCHE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function FirmenprofilSettings() {
  const [isLoaded, setIsLoaded] = useState(false);

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
      reportingBoundaryNotes: '',
      exclusions: '',
    },
  });

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
          setValue('reportingBoundaryNotes', data.reportingBoundaryNotes ?? '');
          setValue('exclusions', data.exclusions ?? '');
        }
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, [setValue]);

  const onSubmit = async (values: FormValues) => {
    const result = await saveCompanyProfile({
      firmenname: values.firmenname,
      branche: values.branche as Branche,
      mitarbeiter: values.mitarbeiter,
      standort: values.standort,
      reportingBoundaryNotes: values.reportingBoundaryNotes || undefined,
      exclusions: values.exclusions || undefined,
    });

    if (result.success) {
      toast.success('Firmenprofil gespeichert.');
    } else {
      toast.error(result.error ?? 'Fehler beim Speichern.');
    }
  };

  if (!isLoaded) {
    return (
      <p className="text-sm text-gray-400 animate-pulse">Firmenprofil wird geladen…</p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Firmenname */}
      <div className="space-y-1.5">
        <Label htmlFor="settings-firmenname">Firmenname</Label>
        <Input
          id="settings-firmenname"
          placeholder="z.B. Mustermann Elektro GmbH"
          {...register('firmenname')}
        />
        {errors.firmenname && (
          <p className="text-xs text-red-600">{errors.firmenname.message}</p>
        )}
      </div>

      {/* Branche */}
      <div className="space-y-1.5">
        <Label htmlFor="settings-branche">Branche</Label>
        <Select
          id="settings-branche"
          options={BRANCHE_OPTIONS}
          {...register('branche')}
        />
        {errors.branche && (
          <p className="text-xs text-red-600">{errors.branche.message}</p>
        )}
      </div>

      {/* Mitarbeiter */}
      <div className="space-y-1.5">
        <Label htmlFor="settings-mitarbeiter">Anzahl Mitarbeitende (inkl. Inhaber)</Label>
        <Input
          id="settings-mitarbeiter"
          type="number"
          min={1}
          placeholder="z.B. 12"
          {...register('mitarbeiter')}
        />
        {errors.mitarbeiter && (
          <p className="text-xs text-red-600">{errors.mitarbeiter.message}</p>
        )}
      </div>

      {/* Standort */}
      <div className="space-y-1.5">
        <Label htmlFor="settings-standort">Hauptstandort / Standorte</Label>
        <Input
          id="settings-standort"
          placeholder="z.B. München, Bayern · Kommasepariert für mehrere Standorte"
          {...register('standort')}
        />
        {errors.standort && (
          <p className="text-xs text-red-600">{errors.standort.message}</p>
        )}
        <p className="text-xs text-gray-400">
          Mehrere Standorte kommasepariert angeben, z.B. &bdquo;München, Frankfurt, Hamburg&ldquo;.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Berichtsgrenzen</h3>
        <p className="text-xs text-gray-400 mb-4">
          Definieren Sie, was in diesem Bericht erfasst ist und was ggf. ausgeschlossen wurde.
          Diese Angaben erhöhen die methodische Transparenz im PDF-Export.
        </p>
      </div>

      {/* Reporting Boundary Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="settings-reportingBoundaryNotes">Berichtsgrenzen & Systemgrenzen</Label>
        <textarea
          id="settings-reportingBoundaryNotes"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent min-h-[100px] resize-y"
          placeholder="z.B. Operationelle Kontrolle nach GHG Protocol. Alle Standorte in Deutschland eingeschlossen."
          {...register('reportingBoundaryNotes')}
        />
        <p className="text-xs text-gray-400">
          Beschreiben Sie kurz den Berichtsrahmen: welche Standorte, Geschäftsbereiche oder
          Aktivitäten einbezogen sind und nach welchem Ansatz (z.B. operationelle Kontrolle).
        </p>
      </div>

      {/* Exclusions */}
      <div className="space-y-1.5">
        <Label htmlFor="settings-exclusions">Ausschlüsse & Annahmen (optional)</Label>
        <textarea
          id="settings-exclusions"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent min-h-[80px] resize-y"
          placeholder="z.B. Geschäftsreisen mit privatem PKW wurden nicht erfasst."
          {...register('exclusions')}
        />
        <p className="text-xs text-gray-400">
          Nennen Sie Emissionsquellen, die bewusst nicht erfasst wurden, und begründen Sie dies kurz.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? 'Speichern...' : '💾 Speichern'}
      </Button>
    </form>
  );
}
