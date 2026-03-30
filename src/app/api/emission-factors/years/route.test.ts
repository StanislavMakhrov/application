/**
 * API route tests for GET /api/emission-factors/years
 *
 * Covers TC-12 from the test plan:
 * - TC-12: Returns both dbYears (from DB) and ubaReferenceYears (from static data)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
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

  it('GET_emissionFactorYears_returnsDbAndUbaReferenceYears', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { validYear: 2023 },
      { validYear: 2024 },
    ] as never);

    const req = new NextRequest('http://localhost/api/emission-factors/years');
    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(res.status).toBe(200);
    expect(data.dbYears).toContain(2023);
    expect(data.dbYears).toContain(2024);
    expect(data.ubaReferenceYears).toContain(2023);
    expect(data.ubaReferenceYears).toContain(2024);
  });

  it('GET_emissionFactorYears_withEmptyDb_stillReturnsUbaReferenceYears', async () => {
    // DB has no factors but UBA reference years are always available
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([] as never);

    const res = await GET();
    const data = (await res.json()) as { dbYears: number[]; ubaReferenceYears: number[] };

    expect(res.status).toBe(200);
    expect(data.dbYears).toEqual([]);
    expect(data.ubaReferenceYears.length).toBeGreaterThan(0);
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
