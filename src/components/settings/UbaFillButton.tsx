'use client';

/**
 * UbaFillButton — clickable stub for UBA emission factor auto-fill.
 *
 * Simulates fetching a PDF from the official UBA site and extracting values.
 * Actual data extraction is not implemented; values must be entered manually
 * in the database. The button animates through idle → loading → done states.
 *
 * Also renders a link to the official UBA publication page for the given year.
 */

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

type FillState = 'idle' | 'loading' | 'done';

interface Props {
  year: number;
  /** Called after the simulated recognition completes (for table refresh). */
  onDone?: () => void;
}

/**
 * Returns the URL of the official UBA publication page for emission factors.
 * Links to the UBA search filtered by publication year as a best proxy for
 * the year-specific emission factor document.
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

  function handleClick() {
    if (state !== 'idle') return;
    setState('loading');
    // Simulate PDF download + OCR recognition (~2 s)
    setTimeout(() => {
      setState('done');
      onDone?.();
      // Reset back to idle after a brief confirmation period
      setTimeout(() => setState('idle'), 3000);
    }, 2000);
  }

  const isLoading = state === 'loading';
  const isDone = state === 'done';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        title={
          isDone
            ? 'Erkennung abgeschlossen – Werte bitte manuell prüfen und eintragen'
            : 'UBA-Emissionsfaktoren aus dem offiziellen PDF automatisch erkennen (Simulation)'
        }
        className={[
          'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
          isLoading
            ? 'border-brand-green bg-white text-brand-green opacity-70 cursor-wait'
            : isDone
              ? 'border-green-600 bg-green-50 text-green-700 cursor-default'
              : 'border-brand-green bg-white text-brand-green hover:bg-brand-green hover:text-white cursor-pointer',
        ].join(' ')}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isDone && <CheckCircle2 className="h-4 w-4" />}
        {isLoading
          ? 'Lade UBA-Daten…'
          : isDone
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
  );
}
