/**
 * Unit tests for src/lib/uba-reference-data.ts
 */
import { describe, it, expect } from 'vitest';
import { UBA_REFERENCE_DATA, getUbaReferenceYears } from '../uba-reference-data';

describe('UBA_REFERENCE_DATA', () => {
  it('contains entries for 2023 and 2024', () => {
    expect(UBA_REFERENCE_DATA[2023]).toBeDefined();
    expect(UBA_REFERENCE_DATA[2024]).toBeDefined();
  });

  it('each year has at least one factor', () => {
    for (const [year, factors] of Object.entries(UBA_REFERENCE_DATA)) {
      expect(factors.length).toBeGreaterThan(0), `Year ${year} should have factors`;
    }
  });

  it('every factor has required fields with non-empty values', () => {
    for (const [year, factors] of Object.entries(UBA_REFERENCE_DATA)) {
      for (const f of factors) {
        expect(f.key, `year ${year}`).toBeTruthy();
        expect(f.label, `${f.key} in ${year}`).toBeTruthy();
        expect(typeof f.factorKg, `${f.key} in ${year}`).toBe('number');
        expect(f.unit, `${f.key} in ${year}`).toBeTruthy();
        expect(f.source, `${f.key} in ${year}`).toBeTruthy();
        expect(['SCOPE1', 'SCOPE2', 'SCOPE3']).toContain(f.scope);
      }
    }
  });

  it('source labels match expected "UBA {year}" format', () => {
    for (const [year, factors] of Object.entries(UBA_REFERENCE_DATA)) {
      for (const f of factors) {
        expect(f.source).toBe(`UBA ${year}`);
      }
    }
  });

  it('2024 STROM factor is 0.380 (updated grid factor)', () => {
    const strom = UBA_REFERENCE_DATA[2024].find((f) => f.key === 'STROM');
    expect(strom?.factorKg).toBe(0.380);
  });

  it('2023 STROM factor is 0.434', () => {
    const strom = UBA_REFERENCE_DATA[2023].find((f) => f.key === 'STROM');
    expect(strom?.factorKg).toBe(0.434);
  });

  it('negative factor ABFALL_ALTMETALL exists and is negative', () => {
    const f = UBA_REFERENCE_DATA[2024].find((f) => f.key === 'ABFALL_ALTMETALL');
    expect(f).toBeDefined();
    expect(f!.factorKg).toBeLessThan(0);
  });
});

describe('getUbaReferenceYears', () => {
  it('returns sorted ascending list of years', () => {
    const years = getUbaReferenceYears();
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('includes 2023 and 2024', () => {
    const years = getUbaReferenceYears();
    expect(years).toContain(2023);
    expect(years).toContain(2024);
  });

  it('returns numbers not strings', () => {
    const years = getUbaReferenceYears();
    for (const y of years) {
      expect(typeof y).toBe('number');
    }
  });
});
