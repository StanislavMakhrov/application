/**
 * Unit tests for the FactorHint presentational component (TC-08, TC-09, TC-10, TC-11).
 *
 * Uses react-dom/server renderToStaticMarkup to test rendered output in the
 * node test environment (no jsdom required for purely presentational components).
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FactorHint } from '../FactorHint';
import type { FactorRecord } from '@/types';

const sampleFactor: FactorRecord = {
  factorKg: 2.02,
  unit: 'm³',
  source: 'UBA 2024',
  validYear: 2024,
};

const negativeFactor: FactorRecord = {
  factorKg: -1.5,
  unit: 'kg',
  source: 'UBA 2024',
  validYear: 2024,
};

describe('FactorHint', () => {
  // TC-08: Renders factor text when factor is found (positive value)
  it('TC-08: renders factor hint when the factor key exists in the map', () => {
    const html = renderToStaticMarkup(
      FactorHint({ factorKey: 'ERDGAS', factors: { ERDGAS: sampleFactor } })
    );

    expect(html).toContain('Faktor:');
    expect(html).toContain('2,020'); // de-DE formatted: 2.02 → "2,020"
    expect(html).toContain('kg CO₂e/m³');
    expect(html).toContain('UBA 2024');
    expect(html).toContain('2024');
  });

  // TC-09: Renders "–" when the factor key is not in the map
  it('TC-09: renders placeholder "–" when the factor key is not found', () => {
    const html = renderToStaticMarkup(
      FactorHint({ factorKey: 'UNKNOWN_KEY', factors: { ERDGAS: sampleFactor } })
    );

    expect(html).toContain('–');
    expect(html).not.toContain('Faktor:');
  });

  // TC-10: Renders "–" when factors map is empty (loading state)
  it('TC-10: renders placeholder "–" when factors map is empty (loading state)', () => {
    const html = renderToStaticMarkup(
      FactorHint({ factorKey: 'ERDGAS', factors: {} })
    );

    expect(html).toContain('–');
    expect(html).not.toContain('Faktor:');
  });

  // TC-11: Renders ♻ Gutschrift variant for negative factors
  it('TC-11: renders ♻ Gutschrift variant for negative factor values', () => {
    const html = renderToStaticMarkup(
      FactorHint({
        factorKey: 'ABFALL_ALTMETALL',
        factors: { ABFALL_ALTMETALL: negativeFactor },
      })
    );

    expect(html).toContain('♻');
    expect(html).toContain('Gutschrift');
    expect(html).toContain('1,500'); // absolute value, de-DE formatted
    expect(html).toContain('Recycling reduziert Ihre Bilanz!');
    expect(html).not.toContain('Faktor:');
  });

  // Additional: prefix prop is prepended to factor text
  it('renders optional prefix before "Faktor:" text', () => {
    const html = renderToStaticMarkup(
      FactorHint({
        factorKey: 'ERDGAS',
        factors: { ERDGAS: sampleFactor },
        prefix: 'Quelle: Gas-Jahresabrechnung. ',
      })
    );

    expect(html).toContain('Quelle: Gas-Jahresabrechnung.');
    expect(html).toContain('Faktor:');
  });
});
