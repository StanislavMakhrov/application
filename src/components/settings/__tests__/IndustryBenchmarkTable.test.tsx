/**
 * Unit tests for IndustryBenchmarkTable (TC-15).
 *
 * Uses react-dom/server renderToStaticMarkup to test rendered output in the
 * node test environment (no jsdom required for server components).
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IndustryBenchmarkTable } from '../IndustryBenchmarkTable';
import type { Branche } from '@/types';

const sampleBenchmarks: Array<{ branche: Branche; co2ePerEmployeePerYear: number }> = [
  { branche: 'ELEKTROHANDWERK', co2ePerEmployeePerYear: 4.2 },
  { branche: 'SHK', co2ePerEmployeePerYear: 5.8 },
  { branche: 'BAUGEWERBE', co2ePerEmployeePerYear: 7.1 },
];

describe('IndustryBenchmarkTable', () => {
  // TC-15: Renders BRANCHE_LABELS mapping correctly
  it('TC-15: renders German labels from BRANCHE_LABELS for each branche key', () => {
    const html = renderToStaticMarkup(
      IndustryBenchmarkTable({ benchmarks: sampleBenchmarks })
    );

    // Human-readable labels from BRANCHE_LABELS
    expect(html).toContain('Elektrohandwerk');
    expect(html).toContain('SHK (Sanitär/Heizung/Klima)');
    expect(html).toContain('Baugewerbe');

    // Formatted values in de-DE locale
    expect(html).toContain('4,2');
    expect(html).toContain('5,8');
    expect(html).toContain('7,1');

    // Table structure present
    expect(html).toContain('<table');
    expect(html).toContain('Branche');
    expect(html).toContain('CO₂e/MA/Jahr');
  });

  // Additional: empty state message
  it('shows empty state message when benchmarks array is empty', () => {
    const html = renderToStaticMarkup(
      IndustryBenchmarkTable({ benchmarks: [] })
    );

    expect(html).toContain('Keine Branchenbenchmarks');
    expect(html).not.toContain('<table');
  });
});
