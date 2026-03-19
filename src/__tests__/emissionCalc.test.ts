/**
 * Unit tests for emissionCalc.ts
 * Tests the core CO₂e calculation functions with known UBA emission factors.
 */

import { describe, it, expect } from 'vitest';
import { calculateCo2e, kgToTonnes, sumCo2e } from '../lib/emissionCalc';

describe('calculateCo2e', () => {
  it('calculates CO₂e for electricity consumption (Strom)', () => {
    // 1000 kWh × 0.38 kg CO₂e/kWh = 380 kg CO₂e
    expect(calculateCo2e(1000, 0.38)).toBe(380);
  });

  it('calculates CO₂e for natural gas (Erdgas)', () => {
    // 500 m³ × 2.0 kg CO₂e/m³ = 1000 kg CO₂e
    expect(calculateCo2e(500, 2.0)).toBe(1000);
  });

  it('calculates CO₂e for diesel fuel', () => {
    // 100 L × 2.65 kg CO₂e/L = 265 kg CO₂e
    expect(calculateCo2e(100, 2.65)).toBe(265);
  });

  it('calculates CO₂e for heating oil (Heizöl)', () => {
    // 200 L × 2.68 kg CO₂e/L = 536 kg CO₂e
    expect(calculateCo2e(200, 2.68)).toBeCloseTo(536);
  });

  it('calculates CO₂e for district heating (Fernwärme)', () => {
    // 5000 kWh × 0.175 kg CO₂e/kWh = 875 kg CO₂e
    expect(calculateCo2e(5000, 0.175)).toBe(875);
  });

  it('calculates CO₂e for train travel (Bahn)', () => {
    // 1000 km × 0.006 kg CO₂e/km = 6 kg CO₂e
    expect(calculateCo2e(1000, 0.006)).toBeCloseTo(6);
  });

  it('calculates CO₂e for short-haul flight (Kurzstrecke)', () => {
    // 800 km × 0.255 kg CO₂e/km = 204 kg CO₂e
    expect(calculateCo2e(800, 0.255)).toBeCloseTo(204);
  });

  it('calculates CO₂e for diesel car (Pkw Diesel)', () => {
    // 10000 km × 0.171 kg CO₂e/km = 1710 kg CO₂e (toBeCloseTo handles floating point)
    expect(calculateCo2e(10000, 0.171)).toBeCloseTo(1710);
  });

  it('returns zero for zero quantity', () => {
    expect(calculateCo2e(0, 2.5)).toBe(0);
  });

  it('returns zero for zero factor', () => {
    expect(calculateCo2e(1000, 0)).toBe(0);
  });

  it('throws for negative quantity', () => {
    expect(() => calculateCo2e(-100, 2.0)).toThrow('Menge darf nicht negativ sein');
  });

  it('throws for negative factor', () => {
    expect(() => calculateCo2e(100, -2.0)).toThrow('Emissionsfaktor darf nicht negativ sein');
  });
});

describe('kgToTonnes', () => {
  it('converts kg to tonnes correctly', () => {
    expect(kgToTonnes(1000)).toBe(1);
    expect(kgToTonnes(2500)).toBe(2.5);
    expect(kgToTonnes(0)).toBe(0);
  });

  it('handles fractional kg values', () => {
    expect(kgToTonnes(500)).toBe(0.5);
    expect(kgToTonnes(1)).toBe(0.001);
  });
});

describe('sumCo2e', () => {
  it('sums an array of CO₂e values', () => {
    expect(sumCo2e([100, 200, 300])).toBe(600);
  });

  it('returns 0 for an empty array', () => {
    expect(sumCo2e([])).toBe(0);
  });

  it('returns the value itself for a single element', () => {
    expect(sumCo2e([380])).toBe(380);
  });

  it('sums realistic scope totals', () => {
    // Scope 1: 37950, Scope 2: 40490, Scope 3: 11082.5
    expect(sumCo2e([37950, 40490, 11082.5])).toBeCloseTo(89522.5);
  });
});
