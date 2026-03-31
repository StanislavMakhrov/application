/**
 * API route tests for GET /api/emission-factors/years
 *
 * Returns the union of ReportingYear years and emission factor years so that
 * newly added Berichtsjahre (with no factors yet) still appear in the selector.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reportingYear: {
      findMany: vi.fn(),
    },
    emissionFactor: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('GET /api/emission-factors/years', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty factor years
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.reportingYear.findMany).mockResolvedValue([] as never);
  });

  it('GET_emissionFactorYears_returnsDbYears_fromEmissionFactors', async () => {
    vi.mocked(prisma.reportingYear.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { validYear: 2023 },
      { validYear: 2024 },
    ] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(res.status).toBe(200);
    expect(data.dbYears).toContain(2023);
    expect(data.dbYears).toContain(2024);
    expect(data.ubaReferenceYears).toEqual([]);
  });

  it('GET_emissionFactorYears_includesReportingYearsWithNoFactors', async () => {
    // A newly added reporting year has no emission factors yet
    vi.mocked(prisma.reportingYear.findMany).mockResolvedValue([
      { year: 2025 },
    ] as never);
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { validYear: 2024 },
    ] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(res.status).toBe(200);
    expect(data.dbYears).toContain(2024);
    expect(data.dbYears).toContain(2025);
    expect(data.ubaReferenceYears).toEqual([]);
  });

  it('GET_emissionFactorYears_withEmptyDb_returnsEmptyArrays', async () => {
    vi.mocked(prisma.reportingYear.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(res.status).toBe(200);
    expect(data.dbYears).toEqual([]);
    expect(data.ubaReferenceYears).toEqual([]);
  });

  it('GET_emissionFactorYears_deduplicatesOverlappingYears', async () => {
    vi.mocked(prisma.reportingYear.findMany).mockResolvedValue([
      { year: 2023 },
      { year: 2024 },
    ] as never);
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { validYear: 2023 },
      { validYear: 2024 },
    ] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    // No duplicates
    expect(data.dbYears).toEqual([2023, 2024]);
  });

  it('GET_emissionFactorYears_dbYearsAreSortedAscending', async () => {
    vi.mocked(prisma.reportingYear.findMany).mockResolvedValue([
      { year: 2024 },
    ] as never);
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { validYear: 2023 },
    ] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(data.dbYears).toEqual([...data.dbYears].sort((a, b) => a - b));
  });
});
