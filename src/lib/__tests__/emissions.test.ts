/**
 * Unit tests for the CO₂e calculation engine (lib/emissions.ts).
 *
 * These tests mock both the Prisma client and the factor lookup to verify
 * the calculation logic in isolation. Key cases covered:
 * - Standard emission calculation
 * - Ökostrom flag using STROM_OEKOSTROM factor
 * - Negative factor for recycling credit (ABFALL_ALTMETALL)
 * - Zero result when no factor found
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCO2e, getTotalCO2e } from '../emissions';

// Mock Prisma to avoid live DB connection
vi.mock('../prisma', () => ({
  prisma: {
    reportingYear: {
      findUniqueOrThrow: vi.fn(),
    },
    emissionEntry: {
      findMany: vi.fn(),
    },
    materialEntry: {
      findMany: vi.fn(),
    },
  },
}));

// Mock factor lookup so tests are independent of the DB
vi.mock('../factors', () => ({
  getEmissionFactor: vi.fn(),
}));

import { prisma } from '../prisma';
import { getEmissionFactor } from '../factors';

describe('calculateCO2e', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates 1000 m³ Erdgas × 2.000 = 2000 kg CO₂e', async () => {
    vi.mocked(getEmissionFactor).mockResolvedValueOnce(2.0);

    const result = await calculateCO2e('ERDGAS', 1000, 2024);
    expect(result).toBe(2000);
    expect(getEmissionFactor).toHaveBeenCalledWith('ERDGAS', 2024);
  });

  it('uses STROM_OEKOSTROM factor (0.030) when isOekostrom is true', async () => {
    vi.mocked(getEmissionFactor).mockResolvedValueOnce(0.03);

    const result = await calculateCO2e('STROM', 1000, 2024, { isOekostrom: true });
    expect(result).toBe(30); // 1000 kWh × 0.030 = 30 kg
    // Must look up STROM_OEKOSTROM, not STROM
    expect(getEmissionFactor).toHaveBeenCalledWith('STROM_OEKOSTROM', 2024);
  });

  it('uses regular STROM factor (0.434) when isOekostrom is false', async () => {
    vi.mocked(getEmissionFactor).mockResolvedValueOnce(0.434);

    const result = await calculateCO2e('STROM', 1000, 2024, { isOekostrom: false });
    expect(result).toBeCloseTo(434);
    expect(getEmissionFactor).toHaveBeenCalledWith('STROM', 2024);
  });

  it('correctly applies negative factor for ABFALL_ALTMETALL (recycling credit)', async () => {
    vi.mocked(getEmissionFactor).mockResolvedValueOnce(-1.5);

    const result = await calculateCO2e('ABFALL_ALTMETALL', 100, 2024);
    expect(result).toBe(-150); // 100 kg × -1.5 = -150 kg CO₂e (credit)
  });

  it('returns 0 when no factor is found for the category', async () => {
    vi.mocked(getEmissionFactor).mockResolvedValueOnce(null);

    const result = await calculateCO2e('UNKNOWN_CATEGORY', 1000, 2024);
    expect(result).toBe(0);
  });

  it('handles zero quantity correctly', async () => {
    vi.mocked(getEmissionFactor).mockResolvedValueOnce(2.64);

    const result = await calculateCO2e('DIESEL_FUHRPARK', 0, 2024);
    expect(result).toBe(0);
  });
});

describe('getTotalCO2e', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sums scope 1/2/3 emissions correctly', async () => {
    vi.mocked(prisma.reportingYear.findUniqueOrThrow).mockResolvedValueOnce({
      id: 1,
      year: 2024,
      createdAt: new Date(),
    });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      { id: 1, reportingYearId: 1, scope: 'SCOPE1', category: 'ERDGAS', quantity: 1000, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, reportingYearId: 1, scope: 'SCOPE2', category: 'STROM', quantity: 1000, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);

    // ERDGAS: 1000 × 2.0 = 2000 kg
    // STROM market-based: 1000 × 0.434 = 434 kg (isOekostrom=false, same factor for both methods)
    vi.mocked(getEmissionFactor)
      .mockResolvedValueOnce(2.0)   // ERDGAS
      .mockResolvedValueOnce(0.434); // STROM (location-based equals market-based when isOekostrom=false)

    const result = await getTotalCO2e(1);
    expect(result.scope1).toBeCloseTo(2.0);   // 2000 kg = 2 t
    expect(result.scope2).toBeCloseTo(0.434); // 434 kg = 0.434 t
    expect(result.scope2MarketBased).toBeCloseTo(0.434);
    expect(result.scope2LocationBased).toBeCloseTo(0.434);
    expect(result.scope3).toBe(0);
    expect(result.total).toBeCloseTo(2.434);
  });

  it('scope2LocationBased uses grid factor while scope2MarketBased uses Ökostrom factor', async () => {
    vi.mocked(prisma.reportingYear.findUniqueOrThrow).mockResolvedValueOnce({
      id: 5,
      year: 2024,
      createdAt: new Date(),
    });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      // 1000 kWh Ökostrom — market-based uses 0.030, location-based uses 0.380
      { id: 1, reportingYearId: 5, scope: 'SCOPE2', category: 'STROM', quantity: 1000, isOekostrom: true, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);

    vi.mocked(getEmissionFactor)
      .mockResolvedValueOnce(0.03)  // STROM_OEKOSTROM (market-based)
      .mockResolvedValueOnce(0.38); // STROM (location-based)

    const result = await getTotalCO2e(5);
    expect(result.scope2MarketBased).toBeCloseTo(0.03);  // 1000 × 0.030 / 1000
    expect(result.scope2LocationBased).toBeCloseTo(0.38); // 1000 × 0.380 / 1000
    expect(result.scope2).toBeCloseTo(0.03); // scope2 equals market-based
  });

  it('correctly reduces total when ABFALL_ALTMETALL has negative factor', async () => {
    vi.mocked(prisma.reportingYear.findUniqueOrThrow).mockResolvedValueOnce({
      id: 2,
      year: 2024,
      createdAt: new Date(),
    });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      // 800 kg Restmüll × 0.45 = 360 kg CO₂e
      { id: 1, reportingYearId: 2, scope: 'SCOPE3', category: 'ABFALL_RESTMUELL', quantity: 800, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, createdAt: new Date(), updatedAt: new Date() },
      // 200 kg Altmetall × -1.5 = -300 kg CO₂e (credit)
      { id: 2, reportingYearId: 2, scope: 'SCOPE3', category: 'ABFALL_ALTMETALL', quantity: 200, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);

    vi.mocked(getEmissionFactor)
      .mockResolvedValueOnce(0.45)  // ABFALL_RESTMUELL
      .mockResolvedValueOnce(-1.5); // ABFALL_ALTMETALL

    const result = await getTotalCO2e(2);
    // 360 - 300 = 60 kg = 0.06 t (net scope 3)
    expect(result.scope3).toBeCloseTo(0.06);
    expect(result.total).toBeCloseTo(0.06);
    expect(result.byCategory['ABFALL_ALTMETALL']).toBeCloseTo(-0.3);
  });

  it('includes material entries in scope3 total', async () => {
    vi.mocked(prisma.reportingYear.findUniqueOrThrow).mockResolvedValueOnce({
      id: 3,
      year: 2024,
      createdAt: new Date(),
    });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([
      // 480 kg Kupfer × 3.8 = 1824 kg CO₂e
      { id: 1, reportingYearId: 3, material: 'KUPFER', quantityKg: 480, supplierName: null, inputMethod: 'MANUAL', createdAt: new Date(), updatedAt: new Date() },
    ]);

    vi.mocked(getEmissionFactor).mockResolvedValueOnce(3.8); // KUPFER

    const result = await getTotalCO2e(3);
    expect(result.scope3).toBeCloseTo(1.824); // 1824 kg = 1.824 t
    expect(result.byCategory['KUPFER']).toBeCloseTo(1.824);
  });
});
