'use client';

/**
 * PlausibilityWarning — shows an amber inline warning when a field value is out of range.
 * Helps users spot obvious data entry mistakes before saving.
 */

interface PlausibilityWarningProps {
  message: string | null;
}

export function PlausibilityWarning({ message }: PlausibilityWarningProps) {
  if (!message) return null;
  return (
    <div className="mt-1 flex items-start gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  );
}

/**
 * Computes a plausibility warning message for the given field key and numeric value.
 * Returns null when the value is within expected range.
 */
export function getPlausibilityWarning(fieldKey: string, value: number): string | null {
  if (isNaN(value)) return null;
  switch (fieldKey) {
    case 'ERDGAS':
      if (value > 200000) return 'Sehr hoher Wert. Bitte prüfen.';
      return null;
    case 'STROM':
      if (value < 1000 && value > 0) return 'Ungewöhnlich niedrig für einen Betrieb. Bitte prüfen.';
      if (value > 500000) return 'Ungewöhnlich hoch für einen Betrieb dieser Größe.';
      return null;
    case 'DIESEL_FUHRPARK':
      if (value > 100000) {
        const cars = Math.round(value / 3000);
        return `Entspricht ca. ${cars} Fahrzeugen — plausibel?`;
      }
      return null;
    case 'MITARBEITER':
      if (value < 1) return 'Mindestens 1 Mitarbeiter erforderlich.';
      if (value > 500) return 'Sehr viele Mitarbeitende. Bitte prüfen.';
      return null;
    case 'GESCHAEFTSREISEN_FLUG':
      if (value > 500000) {
        const flights = Math.round(value / 10000);
        return `Entspricht ca. ${flights} Flügen — plausibel?`;
      }
      return null;
    default:
      return null;
  }
}
