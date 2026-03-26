'use client';

/**
 * Screen 4 — Scope 2 Strom & Fernwärme
 *
 * Captures electricity consumption (kWh) with optional Ökostrom flag,
 * and district heating (Fernwärme) in kWh.
 *
 * The providerName field enables mid-year provider-change tracking.
 * documentId threads the source document through to the audit log.
 *
 * Sum calculation is driven by FieldDocumentZone via onDocumentsChange:
 * - Regular invoices are summed.
 * - A Jahresabrechnung (annual invoice) replaces the running total.
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
import { CsvImport } from '@/components/wizard/CsvImport';
import { FieldDocumentZone } from '@/components/wizard/FieldDocumentZone';
import { calculateTotal } from '@/lib/wizard/calculateTotal';
import { UploadOCR } from '@/components/wizard/UploadOCR';
import { ScreenChangeLog } from '@/components/wizard/ScreenChangeLog';
import { PlausibilityWarning, getPlausibilityWarning } from '@/components/wizard/PlausibilityWarning';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { saveEntry, getOrCreateYear } from '@/lib/actions';

const schema = z.object({
  strom: z.coerce.number().min(0).default(0),
  isOekostrom: z.boolean().default(false),
  fernwaerme: z.coerce.number().min(0).default(0),
  // Provider name for mid-year provider changes
  providerName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Screen4Props {
  year: number;
}

export default function Screen4Strom({ year }: Screen4Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  const [lastDocumentId, setLastDocumentId] = useState<number | undefined>();
  const [warnings, setWarnings] = useState<Record<string, string | null>>({});
  // Refresh keys trigger FieldDocumentZone to re-fetch after UploadOCR creates a doc
  const [stromRefreshKey, setStromRefreshKey] = useState(0);
  const [fernwaermeRefreshKey, setFernwaermeRefreshKey] = useState(0);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        strom: 0,
        isOekostrom: false,
        fernwaerme: 0,
      },
    });

  const isOekostrom = watch('isOekostrom');

  useEffect(() => {
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&scope=SCOPE2`)
        .then((r) => r.json())
        .then((entries: Array<{ category: string; quantity: number; isOekostrom: boolean }>) => {
          // Load annual entries into the main fields
          for (const e of entries) {
            if (e.category === 'STROM') {
              setValue('strom', e.quantity);
              setValue('isOekostrom', e.isOekostrom);
            }
            if (e.category === 'FERNWAERME') setValue('fernwaerme', e.quantity);
          }
        });
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const docId = lastDocumentId;
    const providerName = values.providerName || undefined;

    const stromResult = await saveEntry({
      yearId,
      scope: 'SCOPE2',
      category: 'STROM',
      quantity: values.strom,
      isOekostrom: values.isOekostrom,
      providerName,
      documentId: docId,
    });
    if (!stromResult.success) { toast.error('Fehler beim Speichern.'); return; }

    // Fernwärme is always annual
    const fwResult = await saveEntry({
      yearId,
      scope: 'SCOPE2',
      category: 'FERNWAERME',
      quantity: values.fernwaerme,
      documentId: docId,
    });

    if (fwResult.success) toast.success('Strom & Fernwärme gespeichert.');
    else toast.error('Fehler beim Speichern von Fernwärme.');
  };

  const handleCsvResult = (values: Record<string, number>, documentId?: number) => {
    if (values.STROM) setValue('strom', values.STROM);
    if (values.FERNWAERME) setValue('fernwaerme', values.FERNWAERME);
    setLastDocumentId(documentId);
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
        {/* Provider name */}
        <div className="space-y-1.5">
          <Label htmlFor="providerName">Stromanbieter (optional)</Label>
          <Input
            id="providerName"
            type="text"
            placeholder="z. B. Stadtwerke München"
            {...register('providerName')}
          />
          <p className="text-xs text-gray-400">
            Pflichtfeld bei Anbieterwechsel im Laufe des Jahres — erlaubt mehrere Einträge pro Kategorie.
          </p>
        </div>

        {/* Annual Strom total */}
        <div className="space-y-1.5">
          <Label htmlFor="strom">
            Strom (kWh/Jahr)
            <HelpTooltip text="Auf der Strom-Jahresabrechnung unter 'Verbrauch kWh' oder 'Gesamtverbrauch'. Bei monatlichen Rechnungen alle 12 Monate addieren." />
          </Label>
          <Input
            id="strom"
            type="number"
            step="1"
            min={0}
            {...register('strom')}
            onBlur={(e) => setWarnings(w => ({ ...w, STROM: getPlausibilityWarning('STROM', Number(e.target.value)) }))}
          />
          {errors.strom && <p className="text-xs text-red-600">{errors.strom.message}</p>}
          <PlausibilityWarning message={warnings.STROM ?? null} />
          <p className="text-xs text-gray-400">
            Faktor: {isOekostrom ? '0,030' : '0,380'} kg CO₂e/kWh (UBA 2024)
          </p>
          <UploadOCR
            category="STROM"
            fieldKey="STROM"
            year={year}
            onResult={(value, _confidence) => setValue('strom', value)}
            onDocumentStored={() => setStromRefreshKey((k) => k + 1)}
          />
          <FieldDocumentZone
            fieldKey="STROM"
            year={year}
            suppressInitialUpload
            refreshKey={stromRefreshKey}
            onDocumentsChange={(docs) => setValue('strom', calculateTotal(docs))}
          />
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
          <Label htmlFor="fernwaerme">
            Fernwärme (kWh/Jahr)
            <HelpTooltip text="Auf der Fernwärme-Jahresabrechnung Ihres Versorgers" />
          </Label>
          <Input id="fernwaerme" type="number" step="1" min={0} {...register('fernwaerme')} />
          {errors.fernwaerme && <p className="text-xs text-red-600">{errors.fernwaerme.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 0,175 kg CO₂e/kWh (UBA 2024). Nur wenn Fernwärme vorhanden.</p>
          <UploadOCR
            category="FERNWAERME"
            fieldKey="FERNWAERME"
            year={year}
            onResult={(value, _confidence) => setValue('fernwaerme', value)}
            onDocumentStored={() => setFernwaermeRefreshKey((k) => k + 1)}
          />
          <FieldDocumentZone
            fieldKey="FERNWAERME"
            year={year}
            suppressInitialUpload
            refreshKey={fernwaermeRefreshKey}
            onDocumentsChange={(docs) => setValue('fernwaerme', calculateTotal(docs))}
          />
        </div>

        <Button type="submit" disabled={isSubmitting || !yearId} className="rounded-full px-6">
          {isSubmitting ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </form>

      <ScreenChangeLog
        yearId={yearId}
        categories={['STROM', 'FERNWAERME']}
      />

      <WizardNav currentScreen={4} />
    </div>
  );
}
