/**
 * Unit tests for the shared calculateTotal helper.
 *
 * calculateTotal is now defined once in src/lib/wizard/calculateTotal.ts and
 * imported by Screen2Heizung, Screen3Fuhrpark, Screen4Strom, Screen5Dienstreisen,
 * and Screen6Materialien.
 *
 * Behaviour under test:
 * - Annual doc with OCR value → returns OCR value (overrides sum)
 * - Annual doc without OCR value → falls back to sum of other docs' values
 * - No annual doc → returns sum of all docs' recognised values
 * - All docs with null recognizedValue → returns 0
 * - Multiple annual docs → last one wins (if it has an OCR value)
 */

import { describe, it, expect } from 'vitest';
import { calculateTotal } from '@/lib/wizard/calculateTotal';
import type { FieldDocument } from '@/components/wizard/FieldDocumentZone';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeDoc(overrides: Partial<FieldDocument> = {}): FieldDocument {
  return {
    id: 1,
    filePath: '/uploads/test.pdf',
    originalFilename: 'test.pdf',
    mimeType: 'application/pdf',
    uploadedAt: '2024-01-01T00:00:00Z',
    recognizedValue: null,
    billingMonth: null,
    isJahresabrechnung: false,
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateTotal', () => {
  it('returns 0 for an empty document list', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('sums recognizedValues when no annual doc is present', () => {
    const docs = [
      makeDoc({ id: 1, recognizedValue: 100 }),
      makeDoc({ id: 2, recognizedValue: 250 }),
      makeDoc({ id: 3, recognizedValue: 50 }),
    ];
    expect(calculateTotal(docs)).toBe(400);
  });

  it('treats null recognizedValue as 0 in the sum', () => {
    const docs = [
      makeDoc({ id: 1, recognizedValue: 200 }),
      makeDoc({ id: 2, recognizedValue: null }),
    ];
    expect(calculateTotal(docs)).toBe(200);
  });

  it('returns 0 when all docs have null recognizedValue', () => {
    const docs = [
      makeDoc({ id: 1, recognizedValue: null }),
      makeDoc({ id: 2, recognizedValue: null }),
    ];
    expect(calculateTotal(docs)).toBe(0);
  });

  it('returns the OCR value of the annual doc when it has one', () => {
    const docs = [
      makeDoc({ id: 1, recognizedValue: 100 }),
      makeDoc({ id: 2, recognizedValue: 5000, isJahresabrechnung: true }),
    ];
    // Annual doc's value overrides the sum; doc 1 is ignored
    expect(calculateTotal(docs)).toBe(5000);
  });

  it('falls back to sum when annual doc has no OCR value (null)', () => {
    // Bug 2 regression guard: annual doc without OCR value must not zero the field.
    // The fallback sum preserves any previously recognised values from other docs.
    const docs = [
      makeDoc({ id: 1, recognizedValue: 300 }),
      makeDoc({ id: 2, recognizedValue: null, isJahresabrechnung: true }),
    ];
    // Annual doc has no OCR value → sum of all docs = 300 (not 0)
    expect(calculateTotal(docs)).toBe(300);
  });

  it('falls back to 0 when annual doc has no OCR value and all other docs are null', () => {
    const docs = [
      makeDoc({ id: 1, recognizedValue: null }),
      makeDoc({ id: 2, recognizedValue: null, isJahresabrechnung: true }),
    ];
    expect(calculateTotal(docs)).toBe(0);
  });

  it('uses the LAST annual doc when multiple are marked (last-wins)', () => {
    // Multiple annual docs should not happen after UI mutual-exclusion, but the
    // calculation must be deterministic if the server state is inconsistent.
    const docs = [
      makeDoc({ id: 1, recognizedValue: 1000, isJahresabrechnung: true }),
      makeDoc({ id: 2, recognizedValue: 2000, isJahresabrechnung: true }),
    ];
    expect(calculateTotal(docs)).toBe(2000);
  });

  it('falls through to sum when last annual doc has no OCR value but earlier one does', () => {
    // Edge case: last annual doc wins for the OCR-value check, so if last has null
    // the function falls through even if an earlier annual doc has a value.
    const docs = [
      makeDoc({ id: 1, recognizedValue: 1000, isJahresabrechnung: true }),
      makeDoc({ id: 2, recognizedValue: null, isJahresabrechnung: true }),
    ];
    // Last annual doc (id=2) has no OCR value → fall back to sum = 1000
    expect(calculateTotal(docs)).toBe(1000);
  });
});
