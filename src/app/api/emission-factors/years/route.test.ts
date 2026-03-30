/**
 * API route tests for GET /api/emission-factors/years
 *
 * Covers TC-12 from the test plan:
 * - TC-12: Returns dbYears (from DB); ubaReferenceYears is always empty
 *   since UBA reference data is managed in the DB, not bundled in source code.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emissionFactor: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('GET /api/emission-factors/years', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET_emissionFactorYears_returnsDbYears', async () => {
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

  it('GET_emissionFactorYears_withEmptyDb_returnsEmptyArrays', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(res.status).toBe(200);
    expect(data.dbYears).toEqual([]);
    expect(data.ubaReferenceYears).toEqual([]);
  });

  it('GET_emissionFactorYears_dbYearsAreSortedAscending', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { validYear: 2023 },
      { validYear: 2024 },
    ] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(data.dbYears).toEqual([...data.dbYears].sort((a, b) => a - b));
  });
});
