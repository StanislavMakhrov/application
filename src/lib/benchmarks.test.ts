import { describe, it, expect } from 'vitest';
import { getBenchmark, BENCHMARKS_2024, BRANCHEN } from './benchmarks';

describe('getBenchmark', () => {
  it('returns benchmark data for a known Branche', () => {
    const result = getBenchmark('Elektrotechnik');
    expect(result).toBeDefined();
    expect(result?.branche).toBe('Elektrotechnik');
    expect(result?.year).toBe(2024);
    expect(result?.median_t).toBe(8.5);
    expect(result?.p25_t).toBe(4.2);
    expect(result?.p75_t).toBe(15.8);
  });

  it('returns undefined for an unknown Branche', () => {
    // @ts-expect-error — intentionally invalid input for test coverage
    const result = getBenchmark('Unbekannte Branche');
    expect(result).toBeUndefined();
  });

  it('returns undefined for an unknown year', () => {
    const result = getBenchmark('Elektrotechnik', 1999);
    expect(result).toBeUndefined();
  });

  it('p25 is always less than median and median less than p75', () => {
    BENCHMARKS_2024.forEach((b) => {
      expect(b.p25_t).toBeLessThan(b.median_t);
      expect(b.median_t).toBeLessThan(b.p75_t);
    });
  });

  it('has data for every Branche in the BRANCHEN list', () => {
    BRANCHEN.forEach((branche) => {
      const result = getBenchmark(branche);
      expect(result, `Missing benchmark for ${branche}`).toBeDefined();
    });
  });
});
