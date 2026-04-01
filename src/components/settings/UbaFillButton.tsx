'use client';

/**
 * UbaFillButton — clickable stub for UBA emission factor auto-fill.
 *
 * Flow (simulation — no real PDF parsing):
 *   idle → confirmation dialog → loading (2 s) → success toast → idle
 *
 * The confirmation dialog warns that existing factors will be overwritten.
 * Actual data extraction is not implemented; values must be entered manually
 * in the database.
 *
 * Also renders a link to the official UBA publication page for the given year.
 */

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

type FillState = 'idle' | 'confirm' | 'loading' | 'done';

interface Props {
  year: number;
  /** Called after the simulated recognition completes (for table refresh). */
  onDone?: () => void;
}

/**
 * Returns the URL of the official UBA publication page for emission factors.
 * Links to the UBA search filtered by publication year.
 */
function getUbaPublicationUrl(year: number): string {
  return `https://www.umweltbundesamt.de/publikationen?f%5B0%5D=field_published_year_num%3A${year}&f%5B1%5D=field_tags%3A735`;
}

export function UbaFillButton({ year, onDone }: Props) {
  const [state, setState] = useState<FillState>('idle');

  // Reset to idle whenever the year changes so the button is fresh per year.
  useEffect(() => {
    setState('idle');
  }, [year]);

  function handleConfirm() {
    setState('loading');
    // Simulate PDF download + OCR recognition (~2 s)
    setTimeout(() => {
      setState('done');
      onDone?.();
      // Auto-dismiss success feedback after 3 s
      setTimeout(() => setState('idle'), 3000);
    }, 2000);
  }

  return (
    <>
      {/* ── Trigger button + UBA link ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => state === 'idle' && setState('confirm')}
          disabled={state === 'loading'}
          title={
            state === 'done'
              ? 'Erkennung abgeschlossen – Werte bitte manuell prüfen und eintragen'
              : 'UBA-Emissionsfaktoren aus dem offiziellen PDF automatisch erkennen (Simulation)'
          }
          className={[
            'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
            state === 'loading'
              ? 'border-brand-green bg-white text-brand-green opacity-70 cursor-wait'
              : state === 'done'
                ? 'border-green-600 bg-green-50 text-green-700 cursor-default'
                : 'border-brand-green bg-white text-brand-green hover:bg-brand-green hover:text-white cursor-pointer',
          ].join(' ')}
        >
          {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {state === 'done' && <CheckCircle2 className="h-4 w-4" />}
          {state === 'loading'
            ? 'Lade UBA-Daten…'
            : state === 'done'
              ? 'Erkannt – Werte prüfen'
              : 'UBA-Werte übernehmen'}
        </button>

        <a
          href={getUbaPublicationUrl(year)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Offizielle UBA-Emissionsfaktoren ${year} (PDF)`}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-brand-green transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          UBA {year}
        </a>
      </div>

      {/* ── Success toast (shown after confirmation + loading) ──────────── */}
      {state === 'done' && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mt-1">
          UBA-Werte {year} wurden erfolgreich erkannt. Bitte Werte prüfen und bei Bedarf manuell übernehmen.
        </p>
      )}

      {/* ── Confirmation dialog ──────────────────────────────────────────── */}
      {state === 'confirm' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="uba-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <h2 id="uba-dialog-title" className="text-base font-semibold text-gray-800">
              UBA-Werte übernehmen — {year}
            </h2>

            <p className="text-sm text-gray-600">
              Diese Aktion erkennt Emissionsfaktoren aus dem offiziellen UBA-PDF für{' '}
              <strong>{year}</strong> und überschreibt alle bestehenden Faktoren für dieses Jahr.
            </p>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Hinweis: Die automatische Erkennung ist eine Simulation. Die tatsächlichen Werte
              müssen anschließend manuell geprüft und ggf. korrigiert werden.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setState('idle')}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green/90"
              >
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
