'use client';

/**
 * Screen 4 — Scope 2 Strom & Fernwärme
 *
 * Captures electricity consumption (kWh) with optional Ökostrom flag,
 * and district heating (Fernwärme) in kWh.
 *
 * Supports three entry modes for Strom:
 * 1. Annual total (default) — single kWh value for the full year
 * 2. Monthly breakdown — 12 individual monthly values (Jan–Dez)
 * 3. Final annual — marks an annual entry that overrides any monthly data
 *
 * The providerName field enables mid-year provider-change tracking.
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
import { Checkbox } from '@/components/ui/checkbox';
import { WizardNav } from '@/components/wizard/WizardNav';
import { UploadOCR } from '@/components/wizard/UploadOCR';
import { CsvImport } from '@/components/wizard/CsvImport';
import { FieldDocumentZone } from '@/components/wizard/FieldDocumentZone';
import { ScreenChangeLog } from '@/components/wizard/ScreenChangeLog';
import { PlausibilityWarning, getPlausibilityWarning } from '@/components/wizard/PlausibilityWarning';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { saveEntry, getOrCreateYear } from '@/lib/actions';

// Month labels for the monthly breakdown section
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// Statically typed monthly field paths to avoid unsafe casts when calling register/setValue
const MONTHLY_KEYS = [
  'monthly.m1', 'monthly.m2', 'monthly.m3', 'monthly.m4',
  'monthly.m5', 'monthly.m6', 'monthly.m7', 'monthly.m8',
  'monthly.m9', 'monthly.m10', 'monthly.m11', 'monthly.m12',
] as const satisfies ReadonlyArray<`monthly.m${number}`>;

const monthlySchema = z.object({
  m1: z.coerce.number().min(0).default(0),
  m2: z.coerce.number().min(0).default(0),
  m3: z.coerce.number().min(0).default(0),
  m4: z.coerce.number().min(0).default(0),
  m5: z.coerce.number().min(0).default(0),
  m6: z.coerce.number().min(0).default(0),
  m7: z.coerce.number().min(0).default(0),
  m8: z.coerce.number().min(0).default(0),
  m9: z.coerce.number().min(0).default(0),
  m10: z.coerce.number().min(0).default(0),
  m11: z.coerce.number().min(0).default(0),
  m12: z.coerce.number().min(0).default(0),
});
type MonthlyValues = z.infer<typeof monthlySchema>;

const schema = z.object({
  strom: z.coerce.number().min(0).default(0),
  isOekostrom: z.boolean().default(false),
  fernwaerme: z.coerce.number().min(0).default(0),
  // Provider name for mid-year provider changes
  providerName: z.string().optional(),
  // Monthly breakdown toggle
  useMonthly: z.boolean().default(false),
  // When true, the annual total overrides any monthly entries
  isFinalAnnual: z.boolean().default(false),
  monthly: monthlySchema.default({}),
});

type FormValues = z.infer<typeof schema>;

interface Screen4Props {
  year: number;
}

export default function Screen4Strom({ year }: Screen4Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  // documentId is carried from OCR/CSV result to saveEntry for audit linkage
  const [lastDocumentId, setLastDocumentId] = useState<number | undefined>();
  const [warnings, setWarnings] = useState<Record<string, string | null>>({});

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        strom: 0,
        isOekostrom: false,
        fernwaerme: 0,
        useMonthly: false,
        isFinalAnnual: false,
        monthly: { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0 },
      },
    });

  const isOekostrom = watch('isOekostrom');
  const useMonthly = watch('useMonthly');
  const isFinalAnnual = watch('isFinalAnnual');

  useEffect(() => {
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&scope=SCOPE2`)
        .then((r) => r.json())
        .then((entries: Array<{ category: string; quantity: number; isOekostrom: boolean; billingMonth?: number | null }>) => {
          // Load annual entries into the main fields
          for (const e of entries) {
            if (e.category === 'STROM' && !e.billingMonth) {
              setValue('strom', e.quantity);
              setValue('isOekostrom', e.isOekostrom);
            }
            if (e.category === 'FERNWAERME' && !e.billingMonth) setValue('fernwaerme', e.quantity);
          }
          // Detect and restore monthly entries
          const monthlyStrom = entries.filter((e) => e.category === 'STROM' && e.billingMonth);
          if (monthlyStrom.length > 0) {
            setValue('useMonthly', true);
            for (const e of monthlyStrom) {
              // billingMonth is 1–12; MONTHLY_KEYS is 0-indexed
              if (e.billingMonth && e.billingMonth >= 1 && e.billingMonth <= 12) {
                setValue(MONTHLY_KEYS[e.billingMonth - 1], e.quantity);
              }
            }
          }
        });
    });
  }, [year, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!yearId) return;
    const docId = lastDocumentId;
    const providerName = values.providerName || undefined;

    if (values.useMonthly && !values.isFinalAnnual) {
      // Save one entry per month for Strom — use MONTHLY_KEYS to derive the month key
      const monthResults = await Promise.all(
        MONTHLY_KEYS.map((key, idx) =>
          saveEntry({
            yearId,
            scope: 'SCOPE2',
            category: 'STROM',
            quantity: values.monthly[key.split('.')[1] as keyof MonthlyValues],
            isOekostrom: values.isOekostrom,
            billingMonth: idx + 1,
            providerName,
            documentId: docId,
          })
        )
      );
      const allOk = monthResults.every((r) => r.success);
      if (!allOk) { toast.error('Fehler beim Speichern der Monatswerte.'); return; }
    } else {
      // Save a single annual entry (possibly marked as final)
      const stromResult = await saveEntry({
        yearId,
        scope: 'SCOPE2',
        category: 'STROM',
        quantity: values.strom,
        isOekostrom: values.isOekostrom,
        isFinalAnnual: values.isFinalAnnual,
        providerName,
        documentId: docId,
      });
      if (!stromResult.success) { toast.error('Fehler beim Speichern.'); return; }
    }

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

        {/* Monthly billing toggle */}
        <div className="rounded-md border border-gray-100 bg-gray-50 p-4 space-y-3">
          <Checkbox
            id="useMonthly"
            label="Monatliche Rechnungen verwenden"
            checked={useMonthly}
            onChange={(e) => setValue('useMonthly', e.target.checked)}
          />
          {useMonthly && (
            <>
              <Checkbox
                id="isFinalAnnual"
                label="Jahresrechnung (final) — überschreibt Monatswerte"
                checked={isFinalAnnual}
                onChange={(e) => setValue('isFinalAnnual', e.target.checked)}
              />
              {!isFinalAnnual && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {MONTHS.map((month, idx) => {
                    const key = MONTHLY_KEYS[idx];
                    return (
                      <div key={month} className="space-y-0.5">
                        <Label htmlFor={key} className="text-xs">{month}</Label>
                        <Input
                          id={key}
                          type="number"
                          step="1"
                          min={0}
                          className="h-8 text-sm"
                          {...register(key)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Annual Strom total — shown when annual mode or isFinalAnnual */}
        {(!useMonthly || isFinalAnnual) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="strom">
                Strom (kWh/Jahr){isFinalAnnual ? ' — Jahresendsumme' : ''}
                <HelpTooltip text="Auf der Strom-Jahresabrechnung unter 'Verbrauch kWh' oder 'Gesamtverbrauch'. Bei monatlichen Rechnungen alle 12 Monate addieren." />
              </Label>
              <UploadOCR
                category="STROM"
                onResult={(v, _conf, docId) => { setValue('strom', v); setLastDocumentId(docId); }}
              />
            </div>
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
            <FieldDocumentZone fieldKey="STROM" year={year} />
          </div>
        )}

        {/* Ökostrom checkbox */}
        <div>
          <Checkbox
            id="isOekostrom"
            label="Ökostrom (zertifizierter Grünstrom)"
            checked={isOekostrom}
            onChange={(e) => setValue('isOekostrom', e.target.checked)}
          />
          <p className="text-xs text-gray-400 mt-1 ml-7">
            Aktiviert den marktbasierten Ansatz (0,030 kg CO₂e/kWh) gemäß GHG Protocol § 6.3.
            Der Bericht zeigt zusätzlich den locationbasierten Netzstrom-Durchschnitt (0,380 kg CO₂e/kWh) als Vergleichswert.
          </p>
        </div>

        {/* Fernwärme */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="fernwaerme">
              Fernwärme (kWh/Jahr)
              <HelpTooltip text="Auf der Fernwärme-Jahresabrechnung Ihres Versorgers" />
            </Label>
            <UploadOCR
              category="FERNWAERME"
              onResult={(v, _conf, docId) => { setValue('fernwaerme', v); setLastDocumentId(docId); }}
            />
          </div>
          <Input id="fernwaerme" type="number" step="1" min={0} {...register('fernwaerme')} />
          {errors.fernwaerme && <p className="text-xs text-red-600">{errors.fernwaerme.message}</p>}
          <p className="text-xs text-gray-400">Faktor: 0,175 kg CO₂e/kWh (UBA 2024). Nur wenn Fernwärme vorhanden.</p>
          <FieldDocumentZone fieldKey="FERNWAERME" year={year} />
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
