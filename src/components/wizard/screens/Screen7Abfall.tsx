'use client';

/**
 * Screen 7 — Scope 3 Abfall
 * Captures waste quantities: Restmüll, Bauschutt, Altmetall (negative factor!), Sonstiges.
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
import { saveEntry, getOrCreateYear } from '@/lib/actions';

const schema = z.object({
  restmuell: z.coerce.number().min(0).default(0),
  bauschutt: z.coerce.number().min(0).default(0),
  altmetall: z.coerce.number().min(0).default(0),
  sonstiges: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

interface Screen7Props {
  year: number;
}

export default function Screen7Abfall({ year }: Screen7Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { restmuell: 0, bauschutt: 0, altmetall: 0, sonstiges: 0 } });

  useEffect(() => {
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&scope=SCOPE3`)
        .then((r) => r.json())
        .then((entries: Array<{ category: string; quantity: number }>) => {
          for (const e of entries) {
            if (e.category === 'ABFALL_RESTMUELL') setValue('restmuell', e.quantity);
            if (e.category === 'ABFALL_BAUSCHUTT') setValue('bauschutt', e.quantity);
            if (e.category === 'ABFALL_ALTMETALL') setValue('altmetall', e.quantity);
            if (e.category === 'ABFALL_SONSTIGES') setValue('sonstiges', e.quantity);
          }
        });
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const results = await Promise.all([
      saveEntry({ yearId, scope: 'SCOPE3', category: 'ABFALL_RESTMUELL', quantity: values.restmuell }),
      saveEntry({ yearId, scope: 'SCOPE3', category: 'ABFALL_BAUSCHUTT', quantity: values.bauschutt }),
      saveEntry({ yearId, scope: 'SCOPE3', category: 'ABFALL_ALTMETALL', quantity: values.altmetall }),
      saveEntry({ yearId, scope: 'SCOPE3', category: 'ABFALL_SONSTIGES', quantity: values.sonstiges }),
    ]);
    if (results.every((r) => r.success)) toast.success('Abfalldaten gespeichert.');
    else toast.error('Fehler beim Speichern.');
  };

  const handleCsvResult = (values: Record<string, number>) => {
    if (values.ABFALL_RESTMUELL) setValue('restmuell', values.ABFALL_RESTMUELL);
    if (values.ABFALL_BAUSCHUTT) setValue('bauschutt', values.ABFALL_BAUSCHUTT);
    if (values.ABFALL_ALTMETALL) setValue('altmetall', values.ABFALL_ALTMETALL);
    if (values.ABFALL_SONSTIGES) setValue('sonstiges', values.ABFALL_SONSTIGES);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Abfall</h1>
          <p className="text-sm text-gray-500">Scope 3 — Abfallentsorgung</p>
        </div>
        <CsvImport
          categories={['ABFALL_RESTMUELL', 'ABFALL_BAUSCHUTT', 'ABFALL_ALTMETALL', 'ABFALL_SONSTIGES']}
          onResult={handleCsvResult}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="restmuell">Restmüll (kg/Jahr)</Label>
          <Input id="restmuell" type="number" step="0.1" min={0} {...register('restmuell')} />
          {errors.restmuell && <p className="text-xs text-red-600">{errors.restmuell.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 0,450 kg CO₂e/kg (UBA 2024)</p>
          <FieldDocumentZone fieldKey="ABFALL_RESTMUELL" year={year} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bauschutt">Bauschutt (kg/Jahr)</Label>
          <Input id="bauschutt" type="number" step="0.1" min={0} {...register('bauschutt')} />
          {errors.bauschutt && <p className="text-xs text-red-600">{errors.bauschutt.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 0,008 kg CO₂e/kg (UBA 2024)</p>
          <FieldDocumentZone fieldKey="ABFALL_BAUSCHUTT" year={year} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="altmetall">Altmetall / Metallschrott (kg/Jahr)</Label>
          <Input id="altmetall" type="number" step="0.1" min={0} {...register('altmetall')} />
          {errors.altmetall && <p className="text-xs text-red-600">{errors.altmetall.message}</p>}
          <p className="text-xs text-gray-400 font-medium text-brand-green">
            ♻ Gutschrift: −1,500 kg CO₂e/kg — Recycling reduziert Ihre Bilanz! (UBA 2024)
          </p>
          <FieldDocumentZone fieldKey="ABFALL_ALTMETALL" year={year} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sonstiges">Sonstiger Abfall (kg/Jahr)</Label>
          <Input id="sonstiges" type="number" step="0.1" min={0} {...register('sonstiges')} />
          {errors.sonstiges && <p className="text-xs text-red-600">{errors.sonstiges.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 0,350 kg CO₂e/kg (UBA 2024)</p>
          <FieldDocumentZone fieldKey="ABFALL_SONSTIGES" year={year} />
        </div>

        <Button type="submit" disabled={isSubmitting || !yearId} className="rounded-full px-6">
          {isSubmitting ? 'Speichern...' : '💾 Speichern & Abschließen'}
        </Button>
      </form>

      <ScreenChangeLog
        yearId={yearId}
        categories={['ABFALL_RESTMUELL', 'ABFALL_BAUSCHUTT', 'ABFALL_ALTMETALL', 'ABFALL_SONSTIGES']}
        title="Änderungsprotokoll Abfall"
      />

      <WizardNav currentScreen={7} />
    </div>
  );
}
