'use client';

/**
 * EmissionFactorsTableEditable — inline-editable table for emission factors.
 *
 * Renders all factor rows with pencil-edit / save / cancel / delete actions.
 * Mutations hit /api/factors endpoints and call router.refresh() to re-fetch
 * server data without a full page reload.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { EmissionFactorRow } from '@/types';

interface Props {
  rows: EmissionFactorRow[];
}

interface EditState {
  factorKg: string;
  unit: string;
  source: string;
  validYear: string;
}

interface NewRowState {
  key: string;
  factorKg: string;
  unit: string;
  source: string;
  validYear: string;
}

const EMPTY_NEW: NewRowState = { key: '', factorKg: '', unit: '', source: '', validYear: '2024' };

export function EmissionFactorsTableEditable({ rows }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ factorKg: '', unit: '', source: '', validYear: '' });
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<NewRowState>(EMPTY_NEW);
  const [saving, setSaving] = useState(false);

  function startEdit(row: EmissionFactorRow) {
    setEditingId(row.id);
    setEditState({
      factorKg: String(row.factorKg),
      unit: row.unit,
      source: row.source,
      validYear: String(row.validYear),
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(row: EmissionFactorRow) {
    setSaving(true);
    try {
      const res = await fetch(`/api/factors/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factorKg: parseFloat(editState.factorKg),
          unit: editState.unit,
          source: editState.source,
          validYear: parseInt(editState.validYear, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error ?? 'Fehler beim Speichern');
        return;
      }
      toast.success('Faktor gespeichert');
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(row: EmissionFactorRow) {
    if (!confirm(`Faktor „${row.key}" wirklich löschen?`)) return;
    const res = await fetch(`/api/factors/${row.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error ?? 'Fehler beim Löschen');
      return;
    }
    toast.success('Faktor gelöscht');
    router.refresh();
  }

  async function addRow() {
    setSaving(true);
    try {
      const res = await fetch('/api/factors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newRow.key,
          factorKg: parseFloat(newRow.factorKg),
          unit: newRow.unit,
          source: newRow.source,
          validYear: parseInt(newRow.validYear, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error ?? 'Fehler beim Erstellen');
        return;
      }
      toast.success('Faktor hinzugefügt');
      setAdding(false);
      setNewRow(EMPTY_NEW);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left pb-2 pr-3 font-medium text-gray-600">Schlüssel</th>
            <th className="text-left pb-2 pr-3 font-medium text-gray-600">Faktor (kg CO₂e)</th>
            <th className="text-left pb-2 pr-3 font-medium text-gray-600">Einheit</th>
            <th className="text-left pb-2 pr-3 font-medium text-gray-600">Quelle</th>
            <th className="text-left pb-2 pr-3 font-medium text-gray-600">Jahr</th>
            <th className="pb-2 font-medium text-gray-600 w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) =>
            editingId === row.id ? (
              <tr key={row.id} className="bg-blue-50">
                <td className="py-2 pr-3 text-gray-700 font-mono text-xs">{row.key}</td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    step="any"
                    className="w-24 border rounded px-2 py-0.5 text-sm"
                    value={editState.factorKg}
                    onChange={(e) => setEditState((s) => ({ ...s, factorKg: e.target.value }))}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    className="w-20 border rounded px-2 py-0.5 text-sm"
                    value={editState.unit}
                    onChange={(e) => setEditState((s) => ({ ...s, unit: e.target.value }))}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    className="w-32 border rounded px-2 py-0.5 text-sm"
                    value={editState.source}
                    onChange={(e) => setEditState((s) => ({ ...s, source: e.target.value }))}
                  />
                </td>
                <td className="py-2 pr-3">
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
                <td className="py-2 pr-3 font-mono text-xs text-gray-700">{row.key}</td>
                <td className="py-2 pr-3 text-gray-700">{row.factorKg}</td>
                <td className="py-2 pr-3 text-gray-500">{row.unit}</td>
                <td className="py-2 pr-3 text-gray-500">{row.source}</td>
                <td className="py-2 pr-3 text-gray-500">{row.validYear}</td>
                <td className="py-2 flex gap-1">
                  <button onClick={() => startEdit(row)} className="p-1 text-gray-400 hover:text-blue-600" title="Bearbeiten">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteRow(row)} className="p-1 text-gray-400 hover:text-red-600" title="Löschen">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )
          )}

          {/* Add new row form */}
          {adding && (
            <tr className="bg-green-50">
              <td className="py-2 pr-3">
                <input
                  className="w-32 border rounded px-2 py-0.5 text-sm"
                  placeholder="Schlüssel"
                  value={newRow.key}
                  onChange={(e) => setNewRow((s) => ({ ...s, key: e.target.value }))}
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  type="number"
                  step="any"
                  className="w-24 border rounded px-2 py-0.5 text-sm"
                  placeholder="0.0"
                  value={newRow.factorKg}
                  onChange={(e) => setNewRow((s) => ({ ...s, factorKg: e.target.value }))}
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  className="w-20 border rounded px-2 py-0.5 text-sm"
                  placeholder="Einheit"
                  value={newRow.unit}
                  onChange={(e) => setNewRow((s) => ({ ...s, unit: e.target.value }))}
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  className="w-32 border rounded px-2 py-0.5 text-sm"
                  placeholder="Quelle"
                  value={newRow.source}
                  onChange={(e) => setNewRow((s) => ({ ...s, source: e.target.value }))}
                />
              </td>
              <td className="py-2 pr-3">
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
          Faktor hinzufügen
        </button>
      )}
    </div>
  );
}
