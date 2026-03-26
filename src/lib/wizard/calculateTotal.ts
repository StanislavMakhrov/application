/**
 * Shared calculateTotal helper for wizard screens.
 *
 * Extracted from Screen2–Screen6 to eliminate duplication.
 * All screens that use FieldDocumentZone and UploadOCR should import from here.
 *
 * Behaviour:
 * - If any document is marked as Jahresabrechnung AND has an OCR-extracted value,
 *   that value overrides the sum entirely (annual invoice replaces all monthly totals).
 * - If the annual document has no OCR value (uploaded via the plain file button),
 *   fall through to the regular sum so manually-typed values are not erased.
 * - Regular invoices without an annual flag are summed together.
 */

import type { FieldDocument } from '@/components/wizard/FieldDocumentZone';

/**
 * Calculates the running total from a list of FieldDocuments.
 *
 * If any document is marked as Jahresabrechnung AND has an OCR-extracted value,
 * that value overrides the sum entirely (annual invoice replaces all monthly totals).
 * If the annual document has no OCR value (uploaded via the plain file button), fall
 * through to the regular sum so manually-typed values are not erased.
 * Regular invoices without an annual flag are summed together.
 */
export function calculateTotal(docs: FieldDocument[]): number {
  const annualDocs = docs.filter((d) => d.isJahresabrechnung);
  if (annualDocs.length > 0) {
    const lastAnnual = annualDocs[annualDocs.length - 1];
    if (lastAnnual.recognizedValue != null) {
      return lastAnnual.recognizedValue;
    }
  }
  return docs.reduce((sum, d) => sum + (d.recognizedValue ?? 0), 0);
}
