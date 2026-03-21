'use client';

/**
 * Screen 3 — Scope 1 Fuhrpark
 * Captures fuel consumption (Diesel L, Benzin L) and distance-based
 * emissions (PKW km, Transporter km, LKW km).
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
import { UploadOCR } from '@/components/wizard/UploadOCR';
import { CsvImport } from '@/components/wizard/CsvImport';
import { saveEntry, getOrCreateYear } from '@/lib/actions';

const schema = z.object({
  diesel: z.coerce.number().min(0).default(0),
  benzin: z.coerce.number().min(0).default(0),
  pkwBenzinKm: z.coerce.number().min(0).default(0),
  pkwDieselKm: z.coerce.number().min(0).default(0),
  transporterKm: z.coerce.number().min(0).default(0),
  lkwKm: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

interface Screen3Props {
  year: number;
}

export default function Screen3Fuhrpark({ year }: Screen3Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { diesel: 0, benzin: 0, pkwBenzinKm: 0, pkwDieselKm: 0, transporterKm: 0, lkwKm: 0 } });

  useEffect(() => {
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&scope=SCOPE1`)
        .then((r) => r.json())
        .then((entries: Array<{ category: string; quantity: number }>) => {
          for (const e of entries) {
            if (e.category === 'DIESEL_FUHRPARK') setValue('diesel', e.quantity);
            if (e.category === 'BENZIN_FUHRPARK') setValue('benzin', e.quantity);
            if (e.category === 'PKW_BENZIN_KM') setValue('pkwBenzinKm', e.quantity);
            if (e.category === 'PKW_DIESEL_KM') setValue('pkwDieselKm', e.quantity);
            if (e.category === 'TRANSPORTER_KM') setValue('transporterKm', e.quantity);
            if (e.category === 'LKW_KM') setValue('lkwKm', e.quantity);
          }
        });
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const entries = [
      { category: 'DIESEL_FUHRPARK' as const, quantity: values.diesel },
      { category: 'BENZIN_FUHRPARK' as const, quantity: values.benzin },
      { category: 'PKW_BENZIN_KM' as const, quantity: values.pkwBenzinKm },
      { category: 'PKW_DIESEL_KM' as const, quantity: values.pkwDieselKm },
      { category: 'TRANSPORTER_KM' as const, quantity: values.transporterKm },
      { category: 'LKW_KM' as const, quantity: values.lkwKm },
    ];
    const results = await Promise.all(
      entries.map((e) => saveEntry({ yearId, scope: 'SCOPE1', category: e.category, quantity: e.quantity }))
    );
    if (results.every((r) => r.success)) toast.success('Fuhrpark gespeichert.');
    else toast.error('Fehler beim Speichern.');
  };

  const handleCsvResult = (values: Record<string, number>) => {
    if (values.DIESEL_FUHRPARK) setValue('diesel', values.DIESEL_FUHRPARK);
    if (values.BENZIN_FUHRPARK) setValue('benzin', values.BENZIN_FUHRPARK);
  };

  const fields = [
    { id: 'diesel', label: 'Diesel gesamt (L/Jahr)', category: 'DIESEL_FUHRPARK', hint: 'Faktor: 2,640 kg CO₂e/L' },
    { id: 'benzin', label: 'Benzin gesamt (L/Jahr)', category: 'BENZIN_FUHRPARK', hint: 'Faktor: 2,330 kg CO₂e/L' },
    { id: 'pkwBenzinKm', label: 'PKW Benzin (km/Jahr)', category: null, hint: 'Faktor: 0,142 kg CO₂e/km' },
    { id: 'pkwDieselKm', label: 'PKW Diesel (km/Jahr)', category: null, hint: 'Faktor: 0,171 kg CO₂e/km' },
    { id: 'transporterKm', label: 'Transporter (km/Jahr)', category: null, hint: 'Faktor: 0,210 kg CO₂e/km' },
    { id: 'lkwKm', label: 'LKW (km/Jahr)', category: null, hint: 'Faktor: 0,320 kg CO₂e/km' },
  ] as const;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fuhrpark</h1>
          <p className="text-sm text-gray-500">Scope 1 — Kraftstoffverbrauch und Fahrleistung</p>
        </div>
        <CsvImport categories={['DIESEL_FUHRPARK', 'BENZIN_FUHRPARK']} onResult={handleCsvResult} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {fields.map((f) => (
          <div key={f.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={f.id}>{f.label}</Label>
              {f.category && (
                <UploadOCR category={f.category} onResult={(v) => setValue(f.id, v)} />
              )}
            </div>
            <Input id={f.id} type="number" step="0.1" min={0} {...register(f.id)} />
            {errors[f.id] && <p className="text-xs text-red-600">{errors[f.id]?.message}</p>}
            <p className="text-xs text-gray-400">{f.hint} (UBA 2024)</p>
          </div>
        ))}

        <Button type="submit" disabled={isSubmitting || !yearId}>
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <WizardNav currentScreen={3} />
    </div>
  );
}
