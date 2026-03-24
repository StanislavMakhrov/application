/**
 * Unit tests for the CO₂e calculation engine (lib/emissions.ts).
 *
 * These tests mock both the Prisma client and the factor lookup to verify
 * the calculation logic in isolation. Key cases covered:
 * - Standard emission calculation
 * - Ökostrom flag using STROM_OEKOSTROM factor
 * - supplierSpecificFactor for market-based Scope 2
 * - Negative factor for recycling credit (ABFALL_ALTMETALL)
 * - Zero result when no factor found
 * - Scope 2 dual-method (location-based vs. market-based) totals
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

  it('uses supplierSpecificFactor directly for STROM market-based calculation', async () => {
    const result = await calculateCO2e('STROM', 1000, 2024, { supplierSpecificFactor: 0.05 });
    expect(result).toBe(50); // 1000 kWh × 0.050 = 50 kg
    // supplierSpecificFactor is used directly — no DB lookup needed
    expect(getEmissionFactor).not.toHaveBeenCalled();
  });

  it('supplierSpecificFactor takes precedence over isOekostrom for STROM', async () => {
    const result = await calculateCO2e('STROM', 1000, 2024, {
      isOekostrom: true,
      supplierSpecificFactor: 0.02,
    });
    expect(result).toBe(20); // 1000 kWh × 0.020 = 20 kg
    // supplierSpecificFactor used directly — no factor lookup
    expect(getEmissionFactor).not.toHaveBeenCalled();
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
      { id: 1, reportingYearId: 1, scope: 'SCOPE1', category: 'ERDGAS', quantity: 1000, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, supplierSpecificFactor: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, reportingYearId: 1, scope: 'SCOPE2', category: 'STROM', quantity: 1000, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, supplierSpecificFactor: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);

    // ERDGAS: 1000 × 2.0 = 2000 kg, STROM: 1000 × 0.434 = 434 kg
    vi.mocked(getEmissionFactor)
      .mockResolvedValueOnce(2.0)   // ERDGAS
      .mockResolvedValueOnce(0.434); // STROM

    const result = await getTotalCO2e(1);
    expect(result.scope1).toBeCloseTo(2.0);   // 2000 kg = 2 t
    expect(result.scope2).toBeCloseTo(0.434); // 434 kg = 0.434 t
    expect(result.scope3).toBe(0);
    expect(result.total).toBeCloseTo(2.434);
    // No market-based data → scope2LocationBased = scope2, scope2MarketBased = null
    expect(result.scope2LocationBased).toBeCloseTo(0.434);
    expect(result.scope2MarketBased).toBeNull();
  });

  it('correctly reduces total when ABFALL_ALTMETALL has negative factor', async () => {
    vi.mocked(prisma.reportingYear.findUniqueOrThrow).mockResolvedValueOnce({
      id: 2,
      year: 2024,
      createdAt: new Date(),
    });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      // 800 kg Restmüll × 0.45 = 360 kg CO₂e
      { id: 1, reportingYearId: 2, scope: 'SCOPE3', category: 'ABFALL_RESTMUELL', quantity: 800, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, supplierSpecificFactor: null, createdAt: new Date(), updatedAt: new Date() },
      // 200 kg Altmetall × -1.5 = -300 kg CO₂e (credit)
      { id: 2, reportingYearId: 2, scope: 'SCOPE3', category: 'ABFALL_ALTMETALL', quantity: 200, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, supplierSpecificFactor: null, createdAt: new Date(), updatedAt: new Date() },
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

  it('computes scope2LocationBased and scope2MarketBased when isOekostrom is true', async () => {
    vi.mocked(prisma.reportingYear.findUniqueOrThrow).mockResolvedValueOnce({
      id: 4,
      year: 2024,
      createdAt: new Date(),
    });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      // 1000 kWh Ökostrom: market uses STROM_OEKOSTROM (0.030), location uses STROM (0.380)
      { id: 1, reportingYearId: 4, scope: 'SCOPE2', category: 'STROM', quantity: 1000, isOekostrom: true, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, supplierSpecificFactor: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);

    vi.mocked(getEmissionFactor)
      .mockResolvedValueOnce(0.03)   // STROM_OEKOSTROM (for market-based scope2Kg)
      .mockResolvedValueOnce(0.380); // STROM (for location-based)

    const result = await getTotalCO2e(4);
    expect(result.scope2).toBeCloseTo(0.03);              // market-based: 30 kg = 0.030 t
    expect(result.scope2LocationBased).toBeCloseTo(0.38); // location-based: 380 kg = 0.380 t
    expect(result.scope2MarketBased).toBeCloseTo(0.03);   // same as scope2 when market available
  });

  it('computes scope2LocationBased and scope2MarketBased when supplierSpecificFactor is set', async () => {
    vi.mocked(prisma.reportingYear.findUniqueOrThrow).mockResolvedValueOnce({
      id: 5,
      year: 2024,
      createdAt: new Date(),
    });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      // 2000 kWh with supplier factor 0.05 kg/kWh (market), location uses STROM (0.380)
      { id: 1, reportingYearId: 5, scope: 'SCOPE2', category: 'STROM', quantity: 2000, isOekostrom: false, memo: null, inputMethod: 'MANUAL', billingMonth: null, isFinalAnnual: false, providerName: null, supplierSpecificFactor: 0.05, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);

    // supplierSpecificFactor used directly (no DB lookup for market-based)
    // location-based requires DB lookup for STROM factor
    vi.mocked(getEmissionFactor).mockResolvedValueOnce(0.380); // STROM for location-based

    const result = await getTotalCO2e(5);
    expect(result.scope2).toBeCloseTo(0.1);               // market-based: 2000×0.05=100 kg=0.1 t
    expect(result.scope2LocationBased).toBeCloseTo(0.76); // location-based: 2000×0.380=760 kg=0.760 t
    expect(result.scope2MarketBased).toBeCloseTo(0.1);    // same as scope2 when market available
  });
});
