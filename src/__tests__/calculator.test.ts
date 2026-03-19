/**
 * Unit tests for the CO₂ footprint calculator.
 * Tests the pure calculateFootprint function with UBA 2024 emission factors.
 * Formula: scope1_t = (erdgas_m3×2.0 + diesel_l×2.65 + heizoel_l×2.68) ÷ 1000
 *          scope2_t = strom_kwh × 0.380 ÷ 1000
 */
import { describe, it, expect } from 'vitest';
import { calculateFootprint } from '../lib/calculator';
import { UBA_2024 } from '../lib/emission-factors';

describe('calculateFootprint', () => {
  it('returns zero for all-zero inputs', () => {
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 0, diesel_l: 0, heizoel_l: 0 },
      UBA_2024,
    );
    expect(result.scope1_t).toBe(0);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBe(0);
  });

  it('calculates Scope 2 correctly for strom only', () => {
    // 10000 kWh × 0.380 kg/kWh = 3800 kg = 3.8 t CO₂
    const result = calculateFootprint(
      { strom_kwh: 10000, erdgas_m3: 0, diesel_l: 0, heizoel_l: 0 },
      UBA_2024,
    );
    expect(result.scope1_t).toBe(0);
    expect(result.scope2_t).toBeCloseTo(3.8, 5);
    expect(result.total_t).toBeCloseTo(3.8, 5);
  });

  it('calculates Scope 1 correctly for erdgas only', () => {
    // 1000 m³ × 2.0 kg/m³ = 2000 kg = 2.0 t CO₂
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 1000, diesel_l: 0, heizoel_l: 0 },
      UBA_2024,
    );
    expect(result.scope1_t).toBeCloseTo(2.0, 5);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBeCloseTo(2.0, 5);
  });

  it('calculates Scope 1 correctly for diesel only', () => {
    // 1000 L × 2.65 kg/L = 2650 kg = 2.65 t CO₂
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 0, diesel_l: 1000, heizoel_l: 0 },
      UBA_2024,
    );
    expect(result.scope1_t).toBeCloseTo(2.65, 5);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBeCloseTo(2.65, 5);
  });

  it('calculates Scope 1 correctly for heizöl only', () => {
    // 1000 L × 2.68 kg/L = 2680 kg = 2.68 t CO₂
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 0, diesel_l: 0, heizoel_l: 1000 },
      UBA_2024,
    );
    expect(result.scope1_t).toBeCloseTo(2.68, 5);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBeCloseTo(2.68, 5);
  });

  it('calculates combined inputs correctly', () => {
    // scope1_kg = 2000×2.0 + 1500×2.65 + 500×2.68 = 4000 + 3975 + 1340 = 9315 kg = 9.315 t
    // scope2_kg = 15000×0.380 = 5700 kg = 5.7 t
    // total = 9.315 + 5.7 = 15.015 t
    const result = calculateFootprint(
      { strom_kwh: 15000, erdgas_m3: 2000, diesel_l: 1500, heizoel_l: 500 },
      UBA_2024,
    );
    expect(result.scope1_t).toBeCloseTo(9.315, 4);
    expect(result.scope2_t).toBeCloseTo(5.7, 5);
    expect(result.total_t).toBeCloseTo(15.015, 4);
  });

  it('total equals scope1 + scope2', () => {
    const result = calculateFootprint(
      { strom_kwh: 8000, erdgas_m3: 3000, diesel_l: 800, heizoel_l: 200 },
      UBA_2024,
    );
    expect(result.total_t).toBeCloseTo(result.scope1_t + result.scope2_t, 10);
  });

  it('is deterministic — same inputs always produce same outputs', () => {
    const inputs = { strom_kwh: 12345, erdgas_m3: 678, diesel_l: 910, heizoel_l: 111 };
    const result1 = calculateFootprint(inputs, UBA_2024);
    const result2 = calculateFootprint(inputs, UBA_2024);
    expect(result1).toEqual(result2);
  });

  it('works with custom emission factors', () => {
    const customFactors = { strom_kwh: 0.5, erdgas_m3: 2.5, diesel_l: 3.0, heizoel_l: 3.0 };
    // 1000 m³ × 2.5 = 2500 kg = 2.5 t scope1
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 1000, diesel_l: 0, heizoel_l: 0 },
      customFactors,
    );
    expect(result.scope1_t).toBeCloseTo(2.5, 5);
  });
});
