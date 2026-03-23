'use client';

/**
 * Screen 2 — Scope 1 Heizung
 *
 * Captures Erdgas (m³), Heizöl (L), Flüssiggas (kg), and Kältemittel (kg)
 * consumption. Kältemittel (refrigerant leaks) are Scope 1 direct emissions
 * with very high GWP values.
 *
 * The providerName field enables tracking when the gas/oil supplier
 * changes mid-year — each provider gets its own entry row.
 * documentId threads the source document through to the audit log.
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
  erdgas: z.coerce.number().min(0, 'Wert ≥ 0').default(0),
  heizoel: z.coerce.number().min(0, 'Wert ≥ 0').default(0),
  fluessiggas: z.coerce.number().min(0, 'Wert ≥ 0').default(0),
  // Kältemittel (refrigerant leaks) — Scope 1 direct emissions
  r410a: z.coerce.number().min(0).default(0),
  r32: z.coerce.number().min(0).default(0),
  r134a: z.coerce.number().min(0).default(0),
  sonstigeKaeltemittel: z.coerce.number().min(0).default(0),
  // Provider name for mid-year supplier changes
  providerName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Screen2Props {
  year: number;
}

export default function Screen2Heizung({ year }: Screen2Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  // documentId carried from OCR/CSV result to saveEntry for audit linkage
  const [lastDocumentId, setLastDocumentId] = useState<number | undefined>();
  const [warnings, setWarnings] = useState<Record<string, string | null>>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { erdgas: 0, heizoel: 0, fluessiggas: 0, r410a: 0, r32: 0, r134a: 0, sonstigeKaeltemittel: 0 },
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
            if (e.category === 'R410A_KAELTEMITTEL') setValue('r410a', e.quantity);
            if (e.category === 'R32_KAELTEMITTEL') setValue('r32', e.quantity);
            if (e.category === 'R134A_KAELTEMITTEL') setValue('r134a', e.quantity);
            if (e.category === 'SONSTIGE_KAELTEMITTEL') setValue('sonstigeKaeltemittel', e.quantity);
          }
        })
        .catch(() => {});
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const providerName = values.providerName || undefined;
    const entries = [
      { category: 'ERDGAS' as const, quantity: values.erdgas },
      { category: 'HEIZOEL' as const, quantity: values.heizoel },
      { category: 'FLUESSIGGAS' as const, quantity: values.fluessiggas },
      { category: 'R410A_KAELTEMITTEL' as const, quantity: values.r410a },
      { category: 'R32_KAELTEMITTEL' as const, quantity: values.r32 },
      { category: 'R134A_KAELTEMITTEL' as const, quantity: values.r134a },
      { category: 'SONSTIGE_KAELTEMITTEL' as const, quantity: values.sonstigeKaeltemittel },
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

    if (results.every((r) => r.success)) {
      toast.success('Heizungsdaten gespeichert.');
    } else {
      toast.error('Fehler beim Speichern. Bitte erneut versuchen.');
    }
  };

  const handleCsvResult = (values: Record<string, number>, documentId?: number) => {
    if (values.ERDGAS !== undefined) setValue('erdgas', values.ERDGAS);
    if (values.HEIZOEL !== undefined) setValue('heizoel', values.HEIZOEL);
    if (values.FLUESSIGGAS !== undefined) setValue('fluessiggas', values.FLUESSIGGAS);
    setLastDocumentId(documentId);
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
        {/* Provider name */}
        <div className="space-y-1.5">
          <Label htmlFor="providerName">Gasanbieter / Lieferant (optional)</Label>
          <Input
            id="providerName"
            type="text"
            placeholder="z. B. E.ON, Bayerngas"
            {...register('providerName')}
          />
          <p className="text-xs text-gray-400">
            Bei Anbieterwechsel im Jahr separat erfassen — ein Eintrag pro Anbieter.
          </p>
        </div>

        {/* Erdgas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="erdgas">
              Erdgas (m³/Jahr)
              <HelpTooltip text="Auf der Gas-Jahresabrechnung Ihres Versorgers unter 'Jahresverbrauch' oder 'Gesamtverbrauch in m³'" />
            </Label>
            <UploadOCR
              category="ERDGAS"
              onResult={(v, _conf, docId) => { setValue('erdgas', v); setLastDocumentId(docId); }}
            />
          </div>
          <Input
            id="erdgas"
            type="number"
            step="0.1"
            min={0}
            {...register('erdgas')}
            onBlur={(e) => setWarnings(w => ({ ...w, ERDGAS: getPlausibilityWarning('ERDGAS', Number(e.target.value)) }))}
          />
          {errors.erdgas && <p className="text-xs text-red-600">{errors.erdgas.message}</p>}
          <PlausibilityWarning message={warnings.ERDGAS ?? null} />
          <p className="text-xs text-gray-400">Quelle: Gas-Jahresabrechnung. Faktor: 2,000 kg CO₂e/m³ (UBA 2024)</p>
          <FieldDocumentZone fieldKey="ERDGAS" year={year} />
        </div>

        {/* Heizöl */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="heizoel">
              Heizöl (Liter/Jahr)
              <HelpTooltip text="Aus Lieferscheinen des Heizöllieferanten oder der Jahresabrechnung" />
            </Label>
            <UploadOCR
              category="HEIZOEL"
              onResult={(v, _conf, docId) => { setValue('heizoel', v); setLastDocumentId(docId); }}
            />
          </div>
          <Input id="heizoel" type="number" step="0.1" min={0} {...register('heizoel')} />
          {errors.heizoel && <p className="text-xs text-red-600">{errors.heizoel.message}</p>}
          <p className="text-xs text-gray-400">Quelle: Lieferscheine. Faktor: 2,650 kg CO₂e/L (UBA 2024)</p>
          <FieldDocumentZone fieldKey="HEIZOEL" year={year} />
        </div>

        {/* Flüssiggas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="fluessiggas">
              Flüssiggas (kg/Jahr)
              <HelpTooltip text="Aus Lieferscheinen des Gaslieferanten" />
            </Label>
            <UploadOCR
              category="FLUESSIGGAS"
              onResult={(v, _conf, docId) => { setValue('fluessiggas', v); setLastDocumentId(docId); }}
            />
          </div>
          <Input id="fluessiggas" type="number" step="0.1" min={0} {...register('fluessiggas')} />
          {errors.fluessiggas && <p className="text-xs text-red-600">{errors.fluessiggas.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 1,650 kg CO₂e/kg (UBA 2024)</p>
          <FieldDocumentZone fieldKey="FLUESSIGGAS" year={year} />
        </div>

        {/* Kältemittel — Scope 1 direct emissions from refrigerant leaks */}
        <div className="rounded-md border border-gray-100 bg-gray-50 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              Kältemittel (Scope 1 — direkte Emissionen)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Wo finde ich diese Zahl? Im Kältemittelprotokoll Ihres Kälteanlagen-Wartungsbetriebs
              (Pflicht nach ChemKlimaschutzV)
            </p>
          </div>

          {/* R410A */}
          <div className="space-y-1.5">
            <Label htmlFor="r410a">R410A (kg/Jahr)</Label>
            <Input id="r410a" type="number" step="0.01" min={0} {...register('r410a')} />
            <p className="text-xs text-gray-400">GWP 2.088 — Faktor: 2.088 kg CO₂e/kg (UBA 2024)</p>
            <FieldDocumentZone fieldKey="R410A_KAELTEMITTEL" year={year} />
          </div>

          {/* R32 */}
          <div className="space-y-1.5">
            <Label htmlFor="r32">R32 (kg/Jahr)</Label>
            <Input id="r32" type="number" step="0.01" min={0} {...register('r32')} />
            <p className="text-xs text-gray-400">GWP 675 — Faktor: 675 kg CO₂e/kg (UBA 2024)</p>
            <FieldDocumentZone fieldKey="R32_KAELTEMITTEL" year={year} />
          </div>

          {/* R134a */}
          <div className="space-y-1.5">
            <Label htmlFor="r134a">R134a (kg/Jahr)</Label>
            <Input id="r134a" type="number" step="0.01" min={0} {...register('r134a')} />
            <p className="text-xs text-gray-400">GWP 1.430 — Faktor: 1.430 kg CO₂e/kg (UBA 2024)</p>
            <FieldDocumentZone fieldKey="R134A_KAELTEMITTEL" year={year} />
          </div>

          {/* Sonstige Kältemittel */}
          <div className="space-y-1.5">
            <Label htmlFor="sonstigeKaeltemittel">Sonstige Kältemittel (kg/Jahr)</Label>
            <Input id="sonstigeKaeltemittel" type="number" step="0.01" min={0} {...register('sonstigeKaeltemittel')} />
            <p className="text-xs text-gray-400">Standardfaktor: 1.000 kg CO₂e/kg (UBA 2024)</p>
            <FieldDocumentZone fieldKey="SONSTIGE_KAELTEMITTEL" year={year} />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting || !yearId} className="rounded-full px-6">
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <ScreenChangeLog
        yearId={yearId}
        categories={['ERDGAS', 'HEIZOEL', 'FLUESSIGGAS', 'R410A_KAELTEMITTEL', 'R32_KAELTEMITTEL', 'R134A_KAELTEMITTEL', 'SONSTIGE_KAELTEMITTEL']}
      />

      <WizardNav currentScreen={2} />
    </div>
  );
}
