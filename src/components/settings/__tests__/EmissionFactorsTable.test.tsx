/**
 * Unit tests for EmissionFactorsTable (TC-12, TC-13, TC-14).
 *
 * Uses react-dom/server renderToStaticMarkup to test rendered output in the
 * node test environment (no jsdom required for server components).
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmissionFactorsTable } from '../EmissionFactorsTable';
import type { FactorRecord } from '@/types';

const sampleFactors: Record<string, FactorRecord> = {
  ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 },
  STROM: { factorKg: 0.434, unit: 'kWh', source: 'UBA 2024', validYear: 2024 },
  ABFALL_ALTMETALL: { factorKg: -1.5, unit: 'kg', source: 'UBA 2024', validYear: 2024 },
  // A material key not in CATEGORY_LABELS or CATEGORY_SCOPE
  KUPFER: { factorKg: 3.8, unit: 'kg', source: 'UBA 2024', validYear: 2024 },
};

describe('EmissionFactorsTable', () => {
  // TC-12: Renders table with scope grouping
  it('TC-12: renders factors grouped by scope with appropriate headings', () => {
    const html = renderToStaticMarkup(
      EmissionFactorsTable({ factors: sampleFactors, year: 2024 })
    );

    // Scope headings should be present
    expect(html).toContain('Scope 1');
    expect(html).toContain('Scope 2');
    // ERDGAS is Scope 1
    expect(html).toContain('Erdgas');
    // STROM is Scope 2
    expect(html).toContain('Strom');
  });

  // TC-13: Negative factors shown in green with ♻ prefix
  it('TC-13: renders negative factors with ♻ prefix and green styling', () => {
    const html = renderToStaticMarkup(
      EmissionFactorsTable({ factors: sampleFactors, year: 2024 })
    );

    expect(html).toContain('♻');
    expect(html).toContain('text-green-700');
    // The absolute value should be displayed
    expect(html).toContain('1,500');
  });

  // TC-14: Falls back to raw key for unknown labels
  it('TC-14: falls back to raw key string when key has no CATEGORY_LABELS entry', () => {
    const unknownFactors: Record<string, FactorRecord> = {
      SOME_UNKNOWN_KEY_XYZ: { factorKg: 1.23, unit: 'kg', source: 'Test', validYear: 2024 },
    };

    const html = renderToStaticMarkup(
      EmissionFactorsTable({ factors: unknownFactors, year: 2024 })
    );

    // Should display the raw key as fallback
    expect(html).toContain('SOME_UNKNOWN_KEY_XYZ');
  });

  // Additional: shows empty state message when no factors
  it('shows empty state message when factors map is empty', () => {
    const html = renderToStaticMarkup(
      EmissionFactorsTable({ factors: {}, year: 2024 })
    );

    expect(html).toContain('2024');
    expect(html).not.toContain('<table');
  });
});
