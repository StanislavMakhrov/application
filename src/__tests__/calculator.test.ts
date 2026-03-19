/**
 * Unit tests for the CO₂ footprint calculation engine.
 *
 * Tests the `calculateFootprint` pure function against exact expected values
 * derived from the UBA_2024 emission factors. Each test isolates a single
 * energy carrier to verify the formula independently, then a combined test
 * verifies the full calculation.
 *
 * No mocks needed — calculateFootprint has no I/O.
 */
import { describe, it, expect } from 'vitest';
import { calculateFootprint } from '../lib/calculator';
import { UBA_2024 } from '../lib/emission-factors';

// Zero baseline — no energy use → zero emissions
const ZERO_INPUTS = { strom_kwh: 0, erdgas_m3: 0, diesel_l: 0, heizoel_l: 0 };

describe('calculateFootprint', () => {
  it('all zeros → all results are 0', () => {
    const result = calculateFootprint(ZERO_INPUTS, UBA_2024);
    expect(result.scope1_t).toBe(0);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBe(0);
  });

  it('strom only → scope2 correct, scope1 = 0', () => {
    const result = calculateFootprint({ ...ZERO_INPUTS, strom_kwh: 10_000 }, UBA_2024);
    // 10,000 kWh × 0.380 kg/kWh ÷ 1000 = 3.8 t
    expect(result.scope2_t).toBeCloseTo(3.8, 10);
    expect(result.scope1_t).toBe(0);
    expect(result.total_t).toBeCloseTo(3.8, 10);
  });

  it('erdgas only → scope1 correct, scope2 = 0', () => {
    const result = calculateFootprint({ ...ZERO_INPUTS, erdgas_m3: 1_000 }, UBA_2024);
    // 1,000 m³ × 2.0 kg/m³ ÷ 1000 = 2.0 t
    expect(result.scope1_t).toBeCloseTo(2.0, 10);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBeCloseTo(2.0, 10);
  });

  it('diesel only → scope1 correct, scope2 = 0', () => {
    const result = calculateFootprint({ ...ZERO_INPUTS, diesel_l: 2_000 }, UBA_2024);
    // 2,000 L × 2.65 kg/L ÷ 1000 = 5.3 t
    expect(result.scope1_t).toBeCloseTo(5.3, 10);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBeCloseTo(5.3, 10);
  });

  it('heizöl only → scope1 correct, scope2 = 0', () => {
    const result = calculateFootprint({ ...ZERO_INPUTS, heizoel_l: 1_000 }, UBA_2024);
    // 1,000 L × 2.68 kg/L ÷ 1000 = 2.68 t
    expect(result.scope1_t).toBeCloseTo(2.68, 10);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBeCloseTo(2.68, 10);
  });

  it('all fuels combined → correct totals', () => {
    const inputs = {
      strom_kwh: 25_000,
      erdgas_m3: 5_000,
      diesel_l: 3_000,
      heizoel_l: 2_000,
    };
    const result = calculateFootprint(inputs, UBA_2024);

    // Scope 2: 25,000 × 0.380 / 1000 = 9.5
    const expectedScope2 = (25_000 * 0.38) / 1000;
    // Scope 1: (5,000 × 2.0 + 3,000 × 2.65 + 2,000 × 2.68) / 1000
    //        = (10,000 + 7,950 + 5,360) / 1000 = 23,310 / 1000 = 23.31
    const expectedScope1 = (5_000 * 2.0 + 3_000 * 2.65 + 2_000 * 2.68) / 1000;

    expect(result.scope2_t).toBeCloseTo(expectedScope2, 10);
    expect(result.scope1_t).toBeCloseTo(expectedScope1, 10);
    expect(result.total_t).toBeCloseTo(expectedScope1 + expectedScope2, 10);
  });

  it('verifies the exact formula: total = scope1 + scope2', () => {
    const inputs = {
      strom_kwh: 10_000,
      erdgas_m3: 2_000,
      diesel_l: 500,
      heizoel_l: 750,
    };
    const result = calculateFootprint(inputs, UBA_2024);
    // Exact formula check — total must equal the sum of its parts
    expect(result.total_t).toBe(result.scope1_t + result.scope2_t);
  });
});
