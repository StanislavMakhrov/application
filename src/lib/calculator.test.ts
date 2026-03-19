import { describe, it, expect } from 'vitest';
import { calculateFootprint } from './calculator';
import { UBA_2024 } from './emission-factors';

describe('calculateFootprint', () => {
  it('calculates scope 1 and scope 2 correctly', () => {
    const result = calculateFootprint(
      { strom_kwh: 10000, erdgas_m3: 1000, diesel_l: 500, heizoel_l: 200 },
      UBA_2024,
    );
    // scope1: (1000*2.0 + 500*2.65 + 200*2.68) / 1000 = (2000 + 1325 + 536) / 1000 = 3.861
    // scope2: (10000 * 0.380) / 1000 = 3.8
    expect(result.scope1_t).toBe(3.86);
    expect(result.scope2_t).toBe(3.8);
    expect(result.total_t).toBe(7.66);
  });

  it('returns zero for all-zero inputs', () => {
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 0, diesel_l: 0, heizoel_l: 0 },
      UBA_2024,
    );
    expect(result.scope1_t).toBe(0);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBe(0);
  });

  it('handles electricity-only input', () => {
    const result = calculateFootprint(
      { strom_kwh: 5000, erdgas_m3: 0, diesel_l: 0, heizoel_l: 0 },
      UBA_2024,
    );
    expect(result.scope1_t).toBe(0);
    expect(result.scope2_t).toBe(1.9);
    expect(result.total_t).toBe(1.9);
  });

  it('handles scope 1 only (no electricity)', () => {
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 500, diesel_l: 0, heizoel_l: 0 },
      UBA_2024,
    );
    // scope1: 500 * 2.0 / 1000 = 1.0
    expect(result.scope1_t).toBe(1.0);
    expect(result.scope2_t).toBe(0);
    expect(result.total_t).toBe(1.0);
  });

  it('rounds results to 2 decimal places', () => {
    // 1 kWh * 0.380 = 0.380 kg => 0.00038 t, rounds to 0 at 2dp? No — let's use a larger value
    // 3 m³ erdgas * 2.0 = 6 kg => 0.006 t => rounds to 0.01
    const result = calculateFootprint(
      { strom_kwh: 0, erdgas_m3: 3, diesel_l: 0, heizoel_l: 0 },
      UBA_2024,
    );
    expect(result.scope1_t).toBe(0.01);
  });

  it('totals scope1 + scope2 correctly', () => {
    const result = calculateFootprint(
      { strom_kwh: 1000, erdgas_m3: 100, diesel_l: 50, heizoel_l: 30 },
      UBA_2024,
    );
    // scope1: (100*2.0 + 50*2.65 + 30*2.68) / 1000 = (200 + 132.5 + 80.4) / 1000 = 0.4129 => 0.41
    // scope2: 1000 * 0.38 / 1000 = 0.38
    // total: 0.4129 + 0.38 = 0.7929 => 0.79
    expect(result.total_t).toBe(0.79);
  });
});
