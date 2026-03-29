'use client';

/**
 * UbaFillButton — triggers one-click auto-fill of official UBA emission factors.
 *
 * Shows a confirmation dialog before overwriting existing values (per spec:
 * "full replace" warning). Disabled with tooltip when no UBA reference data
 * exists for the selected year.
 *
 * On success: posts to /api/emission-factors/uba-fill and calls onSuccess()
 * so the parent can refresh the factor table.
 */

import { useState } from 'react';
import { toast } from 'sonner';

interface UbaFillButtonProps {
  year: number;
  /** Whether this year has built-in UBA reference data available */
  isAvailable: boolean;
  /** Called after a successful auto-fill so the table can refresh */
  onSuccess: () => void;
}

export function UbaFillButton({ year, isAvailable, onSuccess }: UbaFillButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/emission-factors/uba-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Unbekannter Fehler');
      }

      const data = (await res.json()) as { upsertedCount: number };
      setShowDialog(false);
      toast.success(`UBA ${year} Faktoren wurden erfolgreich übernommen (${data.upsertedCount} Einträge).`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der UBA-Werte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Auto-fill trigger button */}
      <div title={!isAvailable ? `Keine offiziellen UBA-Werte für ${year} verfügbar.` : undefined}>
        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => { setError(null); setShowDialog(true); }}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-green bg-white px-4 py-2 text-sm font-semibold text-brand-green hover:bg-brand-green-pale disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          UBA-Werte übernehmen
        </button>
      </div>

      {/* Confirmation dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              UBA {year} Werte übernehmen?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Dies überschreibt alle bestehenden Faktoren für {year} mit den offiziellen
              UBA-Werten. Bestehende Werte (auch manuell geänderte) werden ersetzt.
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={isLoading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60 transition-colors"
              >
                {isLoading ? 'Wird geladen…' : 'Übernehmen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
