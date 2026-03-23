'use client';

/**
 * Screen 6 — Scope 3 Materialien (Category 1: Upstream Emissions)
 * Dynamic table where users can add/remove rows for different materials,
 * each with quantity (kg) and optional supplier name.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { WizardNav } from '@/components/wizard/WizardNav';
import { saveMaterialEntries, getOrCreateYear } from '@/lib/actions';
import { MATERIAL_LABELS } from '@/types';
import type { MaterialCategory } from '@/types';
import { ScreenChangeLog } from '@/components/wizard/ScreenChangeLog';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

interface MaterialRow {
  material: MaterialCategory;
  quantityKg: number;
  supplierName: string;
}

const MATERIAL_OPTIONS = Object.entries(MATERIAL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const MATERIAL_FACTORS: Record<MaterialCategory, string> = {
  KUPFER: '3,800',
  STAHL: '1,770',
  ALUMINIUM: '8,240',
  HOLZ: '0,470',
  KUNSTSTOFF_PVC: '2,410',
  BETON: '0,130',
  FARBEN_LACKE: '2,800',
  SONSTIGE: '1,000',
};

interface Screen6Props {
  year: number;
}

export default function Screen6Materialien({ year }: Screen6Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  const [rows, setRows] = useState<MaterialRow[]>([
    { material: 'KUPFER', quantityKg: 0, supplierName: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getOrCreateYear(year).then((y) => {
      if (!y) return;
      setYearId(y.id);
      fetch(`/api/entries?yearId=${y.id}&type=materials`)
        .then((r) => r.json())
        .then((data: Array<{ material: MaterialCategory; quantityKg: number; supplierName: string | null }>) => {
          if (data.length > 0) {
            setRows(data.map((d) => ({
              material: d.material,
              quantityKg: d.quantityKg,
              supplierName: d.supplierName ?? '',
            })));
          }
        })
        .catch(() => {});
    });
  }, [year]);

  const addRow = () => {
    setRows((prev) => [...prev, { material: 'STAHL', quantityKg: 0, supplierName: '' }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof MaterialRow, value: string | number) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = async () => {
    if (!yearId) return;
    setIsSaving(true);
    try {
      const result = await saveMaterialEntries({
        yearId,
        entries: rows.filter((r) => r.quantityKg > 0).map((r) => ({
          material: r.material,
          quantityKg: r.quantityKg,
          supplierName: r.supplierName || undefined,
        })),
      });
      if (result.success) toast.success('Materialien gespeichert.');
      else toast.error(result.error ?? 'Fehler beim Speichern.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-card-border bg-white p-6 shadow-card">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Materialien</h1>
      <p className="text-sm text-gray-500 mb-6">
        Scope 3, Kategorie 1 — vorgelagerte Emissionen eingekaufter Materialien
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left pb-2 pr-3 font-medium text-gray-600">
                Material <HelpTooltip text="Aus Materialeinkauf / DATEV-Konto 3000–3999, oder von Ihrem Lagerbestand" />
              </th>
              <th className="text-left pb-2 pr-3 font-medium text-gray-600">Menge (kg)</th>
              <th className="text-left pb-2 pr-3 font-medium text-gray-600">Lieferant (optional)</th>
              <th className="text-left pb-2 font-medium text-gray-600">Faktor (kg CO₂e/kg)</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="py-2 pr-3">
                  <Select
                    options={MATERIAL_OPTIONS}
                    value={row.material}
                    onChange={(e) => updateRow(i, 'material', e.target.value)}
                    className="w-full"
                  />
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={row.quantityKg}
                    onChange={(e) => updateRow(i, 'quantityKg', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="text"
                    placeholder="z.B. Kabel GmbH"
                    value={row.supplierName}
                    onChange={(e) => updateRow(i, 'supplierName', e.target.value)}
                  />
                </td>
                <td className="py-2 pr-3 text-gray-500">
                  {MATERIAL_FACTORS[row.material]} (UBA 2024)
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded"
                    aria-label="Zeile entfernen"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          + Zeile hinzufügen
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSaving || !yearId}>
          {isSaving ? 'Speichern...' : '💾 Speichern'}
        </Button>
      </div>

      <div className="mt-2">
        <Label className="text-xs text-gray-400">
          Tipp: Geben Sie nur die verbrauchten Mengen ein. Nicht verwendete Materialien können leer bleiben.
        </Label>
      </div>

      <ScreenChangeLog
        yearId={yearId}
        categories={['KUPFER', 'STAHL', 'ALUMINIUM', 'HOLZ', 'KUNSTSTOFF_PVC', 'BETON', 'FARBEN_LACKE', 'SONSTIGE']}
        title="Änderungsprotokoll Materialien"
      />

      <WizardNav currentScreen={6} />
    </div>
  );
}
