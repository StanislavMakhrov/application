'use client';

/**
 * Screen 4 — Scope 2 Strom & Fernwärme
 * Captures electricity consumption (kWh) with optional Ökostrom flag,
 * and district heating (Fernwärme) in kWh.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WizardNav } from '@/components/wizard/WizardNav';
import { UploadOCR } from '@/components/wizard/UploadOCR';
import { CsvImport } from '@/components/wizard/CsvImport';
import { saveEntry, getOrCreateYear } from '@/lib/actions';

const schema = z.object({
  strom: z.coerce.number().min(0).default(0),
  isOekostrom: z.boolean().default(false),
  fernwaerme: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

interface Screen4Props {
  year: number;
}

export default function Screen4Strom({ year }: Screen4Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { strom: 0, isOekostrom: false, fernwaerme: 0 } });

  const isOekostrom = watch('isOekostrom');

  useEffect(() => {
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&scope=SCOPE2`)
        .then((r) => r.json())
        .then((entries: Array<{ category: string; quantity: number; isOekostrom: boolean }>) => {
          for (const e of entries) {
            if (e.category === 'STROM') { setValue('strom', e.quantity); setValue('isOekostrom', e.isOekostrom); }
            if (e.category === 'FERNWAERME') setValue('fernwaerme', e.quantity);
          }
        });
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const results = await Promise.all([
      saveEntry({ yearId, scope: 'SCOPE2', category: 'STROM', quantity: values.strom, isOekostrom: values.isOekostrom }),
      saveEntry({ yearId, scope: 'SCOPE2', category: 'FERNWAERME', quantity: values.fernwaerme }),
    ]);
    if (results.every((r) => r.success)) toast.success('Strom & Fernwärme gespeichert.');
    else toast.error('Fehler beim Speichern.');
  };

  const handleCsvResult = (values: Record<string, number>) => {
    if (values.STROM) setValue('strom', values.STROM);
    if (values.FERNWAERME) setValue('fernwaerme', values.FERNWAERME);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Strom & Fernwärme</h1>
          <p className="text-sm text-gray-500">Scope 2 — eingekaufte Energie</p>
        </div>
        <CsvImport categories={['STROM', 'FERNWAERME']} onResult={handleCsvResult} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Strom */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="strom">Strom (kWh/Jahr)</Label>
            <UploadOCR category="STROM" onResult={(v) => setValue('strom', v)} />
          </div>
          <Input id="strom" type="number" step="1" min={0} {...register('strom')} />
          {errors.strom && <p className="text-xs text-red-600">{errors.strom.message}</p>}
          <p className="text-xs text-gray-400">
            Faktor: {isOekostrom ? '0,030' : '0,434'} kg CO₂e/kWh (UBA 2024)
          </p>
        </div>

        {/* Ökostrom checkbox */}
        <div>
          <Checkbox
            id="isOekostrom"
            label="Ökostrom (zertifizierter Grünstrom)"
            checked={isOekostrom}
            onChange={(e) => setValue('isOekostrom', e.target.checked)}
          />
          <p className="text-xs text-gray-400 mt-1 ml-7">
            Ökostrom-Zertifikat vorhanden? Reduziert den Emissionsfaktor erheblich.
          </p>
        </div>

        {/* Fernwärme */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="fernwaerme">Fernwärme (kWh/Jahr)</Label>
            <UploadOCR category="FERNWAERME" onResult={(v) => setValue('fernwaerme', v)} />
          </div>
          <Input id="fernwaerme" type="number" step="1" min={0} {...register('fernwaerme')} />
          {errors.fernwaerme && <p className="text-xs text-red-600">{errors.fernwaerme.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 0,175 kg CO₂e/kWh (UBA 2024). Nur wenn Fernwärme vorhanden.</p>
        </div>

        <Button type="submit" disabled={isSubmitting || !yearId}>
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <WizardNav currentScreen={4} />
    </div>
  );
}
