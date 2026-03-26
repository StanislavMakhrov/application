'use client';

/**
 * IndustryBenchmarkTableEditable — inline-editable table for industry benchmarks.
 *
 * Renders all benchmark rows with pencil-edit / save / cancel / add actions.
 * Mutations hit /api/benchmarks endpoints and call router.refresh() to re-fetch
 * server data without a full page reload.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { BRANCHE_LABELS } from '@/types';
import type { IndustryBenchmarkRow, Branche } from '@/types';

interface Props {
  rows: IndustryBenchmarkRow[];
}

interface EditState {
  valueKg: string;
  validYear: string;
}

interface NewRowState {
  branche: string;
  valueKg: string;
  validYear: string;
}

const EMPTY_NEW: NewRowState = { branche: '', valueKg: '', validYear: '2024' };

/** Formats a CO₂e value using de-DE locale with 1 decimal place */
function formatValue(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function IndustryBenchmarkTableEditable({ rows }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ valueKg: '', validYear: '' });
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<NewRowState>(EMPTY_NEW);
  const [saving, setSaving] = useState(false);

  function startEdit(row: IndustryBenchmarkRow) {
    setEditingId(row.id);
    setEditState({ valueKg: String(row.valueKg), validYear: String(row.validYear) });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(row: IndustryBenchmarkRow) {
    setSaving(true);
    try {
      const res = await fetch(`/api/benchmarks/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valueKg: parseFloat(editState.valueKg),
          validYear: parseInt(editState.validYear, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error ?? 'Fehler beim Speichern');
        return;
      }
      toast.success('Benchmark gespeichert');
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addRow() {
    setSaving(true);
    try {
      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branche: newRow.branche,
          valueKg: parseFloat(newRow.valueKg),
          validYear: parseInt(newRow.validYear, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error ?? 'Fehler beim Erstellen');
        return;
      }
      toast.success('Benchmark hinzugefügt');
      setAdding(false);
      setNewRow(EMPTY_NEW);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  /** Returns a human-readable display name for a Branche value */
  function brancheLabel(branche: string): string {
    return BRANCHE_LABELS[branche as Branche] ?? branche;
  }

  if (rows.length === 0 && !adding) {
    return (
      <div>
        <p className="text-sm text-gray-500 mb-3">Keine Branchenbenchmarks vorhanden.</p>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-brand-green hover:text-brand-green-dark font-medium"
        >
          <Plus className="h-4 w-4" />
          Benchmark hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left pb-2 pr-4 font-medium text-gray-600">Branche</th>
            <th className="text-left pb-2 pr-4 font-medium text-gray-600">Wert (kg CO₂e/MA/a)</th>
            <th className="text-left pb-2 pr-4 font-medium text-gray-600">Jahr</th>
            <th className="pb-2 font-medium text-gray-600 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) =>
            editingId === row.id ? (
              <tr key={row.id} className="bg-blue-50">
                <td className="py-2 pr-4 text-gray-700">{brancheLabel(row.branche)}</td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    step="any"
                    className="w-28 border rounded px-2 py-0.5 text-sm"
                    value={editState.valueKg}
                    onChange={(e) => setEditState((s) => ({ ...s, valueKg: e.target.value }))}
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    className="w-20 border rounded px-2 py-0.5 text-sm"
                    value={editState.validYear}
                    onChange={(e) => setEditState((s) => ({ ...s, validYear: e.target.value }))}
                  />
                </td>
                <td className="py-2 flex gap-1">
                  <button
                    onClick={() => saveEdit(row)}
                    disabled={saving}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Speichern"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-600" title="Abbrechen">
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="py-2 pr-4 text-gray-700">{brancheLabel(row.branche)}</td>
                <td className="py-2 pr-4 font-mono text-gray-700">{formatValue(row.valueKg)} kg</td>
                <td className="py-2 pr-4 text-gray-500">{row.validYear}</td>
                <td className="py-2 flex gap-1">
                  <button onClick={() => startEdit(row)} className="p-1 text-gray-400 hover:text-blue-600" title="Bearbeiten">
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )
          )}

          {/* Add new row form */}
          {adding && (
            <tr className="bg-green-50">
              <td className="py-2 pr-4">
                <input
                  className="w-40 border rounded px-2 py-0.5 text-sm"
                  placeholder="Branche"
                  value={newRow.branche}
                  onChange={(e) => setNewRow((s) => ({ ...s, branche: e.target.value }))}
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="number"
                  step="any"
                  className="w-28 border rounded px-2 py-0.5 text-sm"
                  placeholder="0.0"
                  value={newRow.valueKg}
                  onChange={(e) => setNewRow((s) => ({ ...s, valueKg: e.target.value }))}
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="number"
                  className="w-20 border rounded px-2 py-0.5 text-sm"
                  value={newRow.validYear}
                  onChange={(e) => setNewRow((s) => ({ ...s, validYear: e.target.value }))}
                />
              </td>
              <td className="py-2 flex gap-1">
                <button
                  onClick={addRow}
                  disabled={saving}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Hinzufügen"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setAdding(false); setNewRow(EMPTY_NEW); }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Abbrechen"
                >
                  <X className="h-4 w-4" />
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-1.5 text-sm text-brand-green hover:text-brand-green-dark font-medium"
        >
          <Plus className="h-4 w-4" />
          Benchmark hinzufügen
        </button>
      )}
    </div>
  );
}
