/**
 * FactorHint — presentational component for emission factor hint text.
 *
 * Replaces hardcoded factor hint strings across all wizard screens with live
 * values sourced from the DB via useFactors(). Shows a "–" placeholder when
 * the factor is missing (loading or unknown key) so the wizard never crashes.
 *
 * Negative factors (e.g. ABFALL_ALTMETALL) are rendered as recycling credits
 * with a ♻ icon and green styling.
 */

import type { FactorRecord } from '@/types';

interface FactorHintProps {
  /** DB factor key, e.g. "ERDGAS", "STROM_OEKOSTROM" */
  factorKey: string;
  /** Pre-fetched factor map from useFactors(); empty while loading */
  factors: Record<string, FactorRecord>;
  /** Optional prefix text shown before "Faktor:", e.g. "Quelle: Gas-Jahresabrechnung. " */
  prefix?: string;
}

/**
 * Formats a number using de-DE locale with exactly 3 decimal places.
 * Matches the existing hint text style: "2,000", "0,142".
 */
function formatFactor(value: number): string {
  return Math.abs(value).toLocaleString('de-DE', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/**
 * Renders a small hint paragraph showing the emission factor for a given key.
 *
 * - Factor found, positive: "Faktor: {value} kg CO₂e/{unit} ({source} {year})"
 * - Factor found, negative: "♻ Gutschrift: {value} kg CO₂e/{unit} — Recycling reduziert Ihre Bilanz! ({source} {year})"
 * - Factor missing or loading: "–"
 */
export function FactorHint({ factorKey, factors, prefix }: FactorHintProps) {
  const record = factors[factorKey];

  if (!record) {
    // Show placeholder while loading or if key is unknown
    return <p className="text-xs text-gray-400">–</p>;
  }

  const { factorKg, unit, source, validYear } = record;
  const formatted = formatFactor(factorKg);

  if (factorKg < 0) {
    // Recycling credit — negative factor reduces the CO₂e balance
    return (
      <p className="text-xs text-green-600 font-medium">
        ♻ Gutschrift: {formatted} kg CO₂e/{unit} — Recycling reduziert Ihre Bilanz! ({source}{' '}
        {validYear})
      </p>
    );
  }

  return (
    <p className="text-xs text-gray-400">
      {prefix}Faktor: {formatted} kg CO₂e/{unit} ({source} {validYear})
    </p>
  );
}
