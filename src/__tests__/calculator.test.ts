/**
 * Unit tests for the CO₂ calculation engine.
 * Verifies all fuel types, edge cases, and GHG Protocol compliance.
 */

import { describe, it, expect } from 'vitest';
import { calculateEmissions } from '../lib/calculator';

describe('calculateEmissions', () => {
  it('calculates Scope 2 (Strom) correctly', () => {
    const result = calculateEmissions({
      strom_kwh: 1000,
      erdgas_m3: 0,
      diesel_l: 0,
      heizoel_l: 0,
    });

    // 1000 kWh * 0.380 kg/kWh / 1000 = 0.38 t
    expect(result.scope2_t).toBe(0.38);
    expect(result.scope1_t).toBe(0);
    expect(result.total_t).toBe(0.38);
    expect(result.breakdown.strom_t).toBe(0.38);
  });

  it('calculates Scope 1 Erdgas correctly', () => {
    const result = calculateEmissions({
      strom_kwh: 0,
      erdgas_m3: 1000,
      diesel_l: 0,
      heizoel_l: 0,
    });

    // 1000 m³ * 2.0 kg/m³ / 1000 = 2.0 t
    expect(result.scope1_t).toBe(2.0);
    expect(result.scope2_t).toBe(0);
    expect(result.breakdown.erdgas_t).toBe(2.0);
  });

  it('calculates Scope 1 Diesel correctly', () => {
    const result = calculateEmissions({
      strom_kwh: 0,
      erdgas_m3: 0,
      diesel_l: 1000,
      heizoel_l: 0,
    });

    // 1000 L * 2.65 kg/L / 1000 = 2.65 t
    expect(result.scope1_t).toBe(2.65);
    expect(result.breakdown.diesel_t).toBe(2.65);
  });

  it('calculates Scope 1 Heizöl correctly', () => {
    const result = calculateEmissions({
      strom_kwh: 0,
      erdgas_m3: 0,
      diesel_l: 0,
      heizoel_l: 1000,
    });

    // 1000 L * 2.68 kg/L / 1000 = 2.68 t
    expect(result.scope1_t).toBe(2.68);
    expect(result.breakdown.heizoel_t).toBe(2.68);
  });

  it('calculates combined all fuel types correctly', () => {
    const result = calculateEmissions({
      strom_kwh: 25000,
      erdgas_m3: 3000,
      diesel_l: 1500,
      heizoel_l: 500,
    });

    // Scope 2: 25000 * 0.380 / 1000 = 9.5 t
    expect(result.scope2_t).toBe(9.5);

    // Scope 1: (3000*2.0 + 1500*2.65 + 500*2.68) / 1000
    //        = (6000 + 3975 + 1340) / 1000
    //        = 11315 / 1000 = 11.315 t
    expect(result.scope1_t).toBe(11.315);
    expect(result.total_t).toBe(20.815);
  });

  it('returns zero for all-zero inputs (edge case)', () => {
    const result = calculateEmissions({
      strom_kwh: 0,
      erdgas_m3: 0,
      diesel_l: 0,
      heizoel_l: 0,
    });

    expect(result.scope1_t).toBe(0);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBe(0);
    expect(result.breakdown.erdgas_t).toBe(0);
    expect(result.breakdown.diesel_t).toBe(0);
    expect(result.breakdown.heizoel_t).toBe(0);
    expect(result.breakdown.strom_t).toBe(0);
  });

  it('handles large enterprise-scale values without precision errors', () => {
    const result = calculateEmissions({
      strom_kwh: 1_000_000,
      erdgas_m3: 100_000,
      diesel_l: 50_000,
      heizoel_l: 50_000,
    });

    // Scope 2: 1,000,000 * 0.38 / 1000 = 380 t
    expect(result.scope2_t).toBe(380);

    // Scope 1: (200,000 + 132,500 + 134,000) / 1000 = 466.5 t
    expect(result.scope1_t).toBe(466.5);
    expect(result.total_t).toBe(846.5);
  });

  it('provides correct breakdown structure', () => {
    const result = calculateEmissions({
      strom_kwh: 5000,
      erdgas_m3: 200,
      diesel_l: 100,
      heizoel_l: 50,
    });

    expect(result.breakdown).toHaveProperty('erdgas_t');
    expect(result.breakdown).toHaveProperty('diesel_t');
    expect(result.breakdown).toHaveProperty('heizoel_t');
    expect(result.breakdown).toHaveProperty('strom_t');

    // Verify breakdown sums match scope totals
    const scope1Sum = result.breakdown.erdgas_t + result.breakdown.diesel_t + result.breakdown.heizoel_t;
    expect(scope1Sum).toBeCloseTo(result.scope1_t, 5);
    expect(result.breakdown.strom_t).toBeCloseTo(result.scope2_t, 5);
  });
});
