'use client';

/**
 * Screen 2 — Scope 1 Heizung
 * Captures Erdgas (m³), Heizöl (L), and Flüssiggas (kg) consumption.
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
  erdgas: z.coerce.number().min(0, 'Wert ≥ 0').default(0),
  heizoel: z.coerce.number().min(0, 'Wert ≥ 0').default(0),
  fluessiggas: z.coerce.number().min(0, 'Wert ≥ 0').default(0),
});

type FormValues = z.infer<typeof schema>;

interface Screen2Props {
  year: number;
}

export default function Screen2Heizung({ year }: Screen2Props) {
  const [yearId, setYearId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { erdgas: 0, heizoel: 0, fluessiggas: 0 },
  });

  useEffect(() => {
    // Ensure reporting year exists and load existing entries
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&scope=SCOPE1`)
        .then((r) => r.json())
        .then((entries: Array<{ category: string; quantity: number }>) => {
          for (const e of entries) {
            if (e.category === 'ERDGAS') setValue('erdgas', e.quantity);
            if (e.category === 'HEIZOEL') setValue('heizoel', e.quantity);
            if (e.category === 'FLUESSIGGAS') setValue('fluessiggas', e.quantity);
          }
        })
        .catch(() => {});
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const entries = [
      { category: 'ERDGAS' as const, quantity: values.erdgas },
      { category: 'HEIZOEL' as const, quantity: values.heizoel },
      { category: 'FLUESSIGGAS' as const, quantity: values.fluessiggas },
    ];

    const results = await Promise.all(
      entries.map((e) =>
        saveEntry({ yearId, scope: 'SCOPE1', category: e.category, quantity: e.quantity })
      )
    );

    if (results.every((r) => r.success)) {
      toast.success('Heizungsdaten gespeichert.');
    } else {
      toast.error('Fehler beim Speichern. Bitte erneut versuchen.');
    }
  };

  const handleCsvResult = (values: Record<string, number>) => {
    if (values.ERDGAS !== undefined) setValue('erdgas', values.ERDGAS);
    if (values.HEIZOEL !== undefined) setValue('heizoel', values.HEIZOEL);
    if (values.FLUESSIGGAS !== undefined) setValue('fluessiggas', values.FLUESSIGGAS);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Heizung & Gebäude</h1>
          <p className="text-sm text-gray-500">Scope 1 — direkte Verbrennungsemissionen</p>
        </div>
        <div className="flex gap-2">
          <CsvImport
            categories={['ERDGAS', 'HEIZOEL', 'FLUESSIGGAS']}
            onResult={handleCsvResult}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Erdgas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="erdgas">Erdgas (m³/Jahr)</Label>
            <UploadOCR category="ERDGAS" onResult={(v) => setValue('erdgas', v)} />
          </div>
          <Input id="erdgas" type="number" step="0.1" min={0} {...register('erdgas')} />
          {errors.erdgas && <p className="text-xs text-red-600">{errors.erdgas.message}</p>}
          <p className="text-xs text-gray-400">Quelle: Gas-Jahresabrechnung. Faktor: 2,000 kg CO₂e/m³ (UBA 2024)</p>
        </div>

        {/* Heizöl */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="heizoel">Heizöl (Liter/Jahr)</Label>
            <UploadOCR category="HEIZOEL" onResult={(v) => setValue('heizoel', v)} />
          </div>
          <Input id="heizoel" type="number" step="0.1" min={0} {...register('heizoel')} />
          {errors.heizoel && <p className="text-xs text-red-600">{errors.heizoel.message}</p>}
          <p className="text-xs text-gray-400">Quelle: Lieferscheine. Faktor: 2,650 kg CO₂e/L (UBA 2024)</p>
        </div>

        {/* Flüssiggas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="fluessiggas">Flüssiggas (kg/Jahr)</Label>
            <UploadOCR category="FLUESSIGGAS" onResult={(v) => setValue('fluessiggas', v)} />
          </div>
          <Input id="fluessiggas" type="number" step="0.1" min={0} {...register('fluessiggas')} />
          {errors.fluessiggas && <p className="text-xs text-red-600">{errors.fluessiggas.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 1,650 kg CO₂e/kg (UBA 2024)</p>
        </div>

        <Button type="submit" disabled={isSubmitting || !yearId}>
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <WizardNav currentScreen={2} />
    </div>
  );
}
