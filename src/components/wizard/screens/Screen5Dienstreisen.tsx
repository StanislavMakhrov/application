'use client';

/**
 * Screen 5 — Scope 3 Dienstreisen & Pendlerverkehr
 * Captures business travel (flights km, rail km) and commuting distances.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardNav } from '@/components/wizard/WizardNav';
import { CsvImport } from '@/components/wizard/CsvImport';
import { FieldDocumentZone } from '@/components/wizard/FieldDocumentZone';
import { ScreenChangeLog } from '@/components/wizard/ScreenChangeLog';
import { PlausibilityWarning, getPlausibilityWarning } from '@/components/wizard/PlausibilityWarning';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { saveEntry, getOrCreateYear } from '@/lib/actions';

const schema = z.object({
  flug: z.coerce.number().min(0).default(0),
  bahn: z.coerce.number().min(0).default(0),
  pendlerKm: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

interface Screen5Props {
  year: number;
}

export default function Screen5Dienstreisen({ year }: Screen5Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<Record<string, string | null>>({});
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { flug: 0, bahn: 0, pendlerKm: 0 } });

  useEffect(() => {
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&scope=SCOPE3`)
        .then((r) => r.json())
        .then((entries: Array<{ category: string; quantity: number }>) => {
          for (const e of entries) {
            if (e.category === 'GESCHAEFTSREISEN_FLUG') setValue('flug', e.quantity);
            if (e.category === 'GESCHAEFTSREISEN_BAHN') setValue('bahn', e.quantity);
            if (e.category === 'PENDLERVERKEHR') setValue('pendlerKm', e.quantity);
          }
        });
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const results = await Promise.all([
      saveEntry({ yearId, scope: 'SCOPE3', category: 'GESCHAEFTSREISEN_FLUG', quantity: values.flug }),
      saveEntry({ yearId, scope: 'SCOPE3', category: 'GESCHAEFTSREISEN_BAHN', quantity: values.bahn }),
      saveEntry({ yearId, scope: 'SCOPE3', category: 'PENDLERVERKEHR', quantity: values.pendlerKm }),
    ]);
    if (results.every((r) => r.success)) toast.success('Dienstreisen & Pendler gespeichert.');
    else toast.error('Fehler beim Speichern.');
  };

  const handleCsvResult = (values: Record<string, number>) => {
    if (values.GESCHAEFTSREISEN_FLUG) setValue('flug', values.GESCHAEFTSREISEN_FLUG);
    if (values.GESCHAEFTSREISEN_BAHN) setValue('bahn', values.GESCHAEFTSREISEN_BAHN);
    if (values.PENDLERVERKEHR) setValue('pendlerKm', values.PENDLERVERKEHR);
  };

  return (
    <div className="rounded-2xl border border-card-border bg-white p-6 shadow-card">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dienstreisen & Pendlerverkehr</h1>
          <p className="text-sm text-gray-500">Scope 3 — Geschäftsreisen und Pendeln</p>
        </div>
        <CsvImport
          categories={['GESCHAEFTSREISEN_FLUG', 'GESCHAEFTSREISEN_BAHN', 'PENDLERVERKEHR']}
          onResult={handleCsvResult}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="flug">
            Geschäftsreisen Flug (km/Jahr, gesamt)
            <HelpTooltip text="Summe aller Flugreisen in km (Hin- und Rückflug zusammenzählen)" />
          </Label>
          <Input
            id="flug"
            type="number"
            step="1"
            min={0}
            {...register('flug')}
            onBlur={(e) => setWarnings(w => ({ ...w, GESCHAEFTSREISEN_FLUG: getPlausibilityWarning('GESCHAEFTSREISEN_FLUG', Number(e.target.value)) }))}
          />
          {errors.flug && <p className="text-xs text-red-600">{errors.flug.message}</p>}
          <PlausibilityWarning message={warnings.GESCHAEFTSREISEN_FLUG ?? null} />
          <p className="text-xs text-gray-400">Summe aller Flüge in km. Faktor: 0,255 kg CO₂e/km (UBA 2024)</p>
          <FieldDocumentZone fieldKey="GESCHAEFTSREISEN_FLUG" year={year} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bahn">Geschäftsreisen Bahn (km/Jahr, gesamt)</Label>
          <Input id="bahn" type="number" step="1" min={0} {...register('bahn')} />
          {errors.bahn && <p className="text-xs text-red-600">{errors.bahn.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 0,032 kg CO₂e/km (UBA 2024)</p>
          <FieldDocumentZone fieldKey="GESCHAEFTSREISEN_BAHN" year={year} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pendlerKm">
            Pendlerverkehr (km/Jahr, alle Mitarbeitenden)
            <HelpTooltip text="Schätzen: Ø Pendelweg km × 2 × Arbeitstage × Anzahl Mitarbeiter" />
          </Label>
          <Input id="pendlerKm" type="number" step="1" min={0} {...register('pendlerKm')} />
          {errors.pendlerKm && <p className="text-xs text-red-600">{errors.pendlerKm.message}</p>}
          <p className="text-xs text-gray-400">
            Berechnung: Anzahl MA × ∅ Pendelweg (km) × 2 × Arbeitstage. Faktor: 0,142 kg CO₂e/km
          </p>
          <FieldDocumentZone fieldKey="PENDLERVERKEHR" year={year} />
        </div>

        <Button type="submit" disabled={isSubmitting || !yearId} className="rounded-full px-6">
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <ScreenChangeLog
        yearId={yearId}
        categories={['GESCHAEFTSREISEN_FLUG', 'GESCHAEFTSREISEN_BAHN', 'PENDLERVERKEHR']}
      />

      <WizardNav currentScreen={5} />
    </div>
  );
}
