'use client';

/**
 * Screen 3 — Scope 1 Fuhrpark
 *
 * Captures fuel consumption (Diesel L, Benzin L) and distance-based
 * emissions (PKW km, Transporter km, LKW km).
 *
 * The providerName field enables tracking when the fuel supplier
 * changes mid-year. documentId threads the source document through
 * to the audit log.
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
import { FieldDocumentZone } from '@/components/wizard/FieldDocumentZone';
import { ScreenChangeLog } from '@/components/wizard/ScreenChangeLog';
import { PlausibilityWarning, getPlausibilityWarning } from '@/components/wizard/PlausibilityWarning';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { saveEntry, getOrCreateYear } from '@/lib/actions';

const schema = z.object({
  diesel: z.coerce.number().min(0).default(0),
  benzin: z.coerce.number().min(0).default(0),
  pkwBenzinKm: z.coerce.number().min(0).default(0),
  pkwDieselKm: z.coerce.number().min(0).default(0),
  transporterKm: z.coerce.number().min(0).default(0),
  lkwKm: z.coerce.number().min(0).default(0),
  // Provider name for mid-year fuel supplier changes
  providerName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Screen3Props {
  year: number;
}

export default function Screen3Fuhrpark({ year }: Screen3Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  // documentId carried from OCR/CSV result to saveEntry for audit linkage
  const [lastDocumentId, setLastDocumentId] = useState<number | undefined>();
  const [warnings, setWarnings] = useState<Record<string, string | null>>({});

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { diesel: 0, benzin: 0, pkwBenzinKm: 0, pkwDieselKm: 0, transporterKm: 0, lkwKm: 0 },
    });

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
    const providerName = values.providerName || undefined;
    const entries = [
      { category: 'DIESEL_FUHRPARK' as const, quantity: values.diesel },
      { category: 'BENZIN_FUHRPARK' as const, quantity: values.benzin },
      { category: 'PKW_BENZIN_KM' as const, quantity: values.pkwBenzinKm },
      { category: 'PKW_DIESEL_KM' as const, quantity: values.pkwDieselKm },
      { category: 'TRANSPORTER_KM' as const, quantity: values.transporterKm },
      { category: 'LKW_KM' as const, quantity: values.lkwKm },
    ];
    const results = await Promise.all(
      entries.map((e) =>
        saveEntry({
          yearId,
          scope: 'SCOPE1',
          category: e.category,
          quantity: e.quantity,
          providerName,
          documentId: lastDocumentId,
        })
      )
    );
    if (results.every((r) => r.success)) toast.success('Fuhrpark gespeichert.');
    else toast.error('Fehler beim Speichern.');
  };

  const handleCsvResult = (values: Record<string, number>, documentId?: number) => {
    if (values.DIESEL_FUHRPARK) setValue('diesel', values.DIESEL_FUHRPARK);
    if (values.BENZIN_FUHRPARK) setValue('benzin', values.BENZIN_FUHRPARK);
    setLastDocumentId(documentId);
  };

  const fields = [
    { id: 'diesel', label: 'Diesel gesamt (L/Jahr)', category: 'DIESEL_FUHRPARK', fieldKey: 'DIESEL_FUHRPARK', hint: 'Faktor: 2,650 kg CO₂e/L' },
    { id: 'benzin', label: 'Benzin gesamt (L/Jahr)', category: 'BENZIN_FUHRPARK', fieldKey: 'BENZIN_FUHRPARK', hint: 'Faktor: 2,330 kg CO₂e/L' },
    { id: 'pkwBenzinKm', label: 'PKW Benzin (km/Jahr)', category: null, fieldKey: 'PKW_BENZIN_KM', hint: 'Faktor: 0,142 kg CO₂e/km' },
    { id: 'pkwDieselKm', label: 'PKW Diesel (km/Jahr)', category: null, fieldKey: 'PKW_DIESEL_KM', hint: 'Faktor: 0,171 kg CO₂e/km' },
    { id: 'transporterKm', label: 'Transporter (km/Jahr)', category: null, fieldKey: 'TRANSPORTER_KM', hint: 'Faktor: 0,210 kg CO₂e/km' },
    { id: 'lkwKm', label: 'LKW (km/Jahr)', category: null, fieldKey: 'LKW_KM', hint: 'Faktor: 0,320 kg CO₂e/km' },
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
        {/* Provider name */}
        <div className="space-y-1.5">
          <Label htmlFor="providerName">Kraftstofflieferant (optional)</Label>
          <Input
            id="providerName"
            type="text"
            placeholder="z. B. Aral, Shell"
            {...register('providerName')}
          />
          <p className="text-xs text-gray-400">
            Bei Lieferantenwechsel im Jahr separat erfassen.
          </p>
        </div>

        {fields.map((f) => (
          <div key={f.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={f.id}>
                {f.id === 'diesel' ? (
                  <>{f.label}<HelpTooltip text="Aus Tankbelegen, DATEV-Konto 4530, oder vom Fuhrparkmanager" /></>
                ) : f.id === 'benzin' ? (
                  <>{f.label}<HelpTooltip text="Aus Tankbelegen oder DATEV-Konto 4530" /></>
                ) : (
                  f.label
                )}
              </Label>
              {f.category && (
                <UploadOCR
                  category={f.category}
                  onResult={(v, _conf, docId) => {
                    setValue(f.id, v);
                    setLastDocumentId(docId);
                  }}
                />
              )}
            </div>
            <Input
              id={f.id}
              type="number"
              step="0.1"
              min={0}
              {...register(f.id)}
              onBlur={(e) => {
                if (f.id === 'diesel') {
                  setWarnings(w => ({ ...w, DIESEL_FUHRPARK: getPlausibilityWarning('DIESEL_FUHRPARK', Number(e.target.value)) }));
                }
              }}
            />
            {errors[f.id] && <p className="text-xs text-red-600">{errors[f.id]?.message}</p>}
            {f.id === 'diesel' && <PlausibilityWarning message={warnings.DIESEL_FUHRPARK ?? null} />}
            <p className="text-xs text-gray-400">{f.hint} (UBA 2024)</p>
            {(f.id === 'diesel' || f.id === 'benzin' || f.id === 'pkwBenzinKm' || f.id === 'pkwDieselKm' || f.id === 'transporterKm' || f.id === 'lkwKm') && (
              <FieldDocumentZone fieldKey={f.fieldKey} year={year} />
            )}
          </div>
        ))}

        <Button type="submit" disabled={isSubmitting || !yearId} className="rounded-full px-6">
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <ScreenChangeLog
        yearId={yearId}
        categories={['DIESEL_FUHRPARK', 'BENZIN_FUHRPARK', 'PKW_BENZIN_KM', 'PKW_DIESEL_KM', 'TRANSPORTER_KM', 'LKW_KM']}
      />

      <WizardNav currentScreen={3} />
    </div>
  );
}
