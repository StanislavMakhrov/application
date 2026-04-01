/**
 * API route tests for GET /api/emission-factors?year={year}
 *
 * Covers TC-11 from the test plan:
 * - TC-11: Returns only factors for the specified year, sorted by scope then key
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

const factors2024 = [
  { id: 1, key: 'ERDGAS', label: 'Erdgas', factorKg: 2.0, unit: 'm³', source: 'UBA 2024', scope: 'SCOPE1', validYear: 2024, createdAt: new Date() },
  { id: 2, key: 'STROM', label: 'Strom (Netzstrom)', factorKg: 0.38, unit: 'kWh', source: 'UBA 2024', scope: 'SCOPE2', validYear: 2024, createdAt: new Date() },
  { id: 3, key: 'GESCHAEFTSREISEN_FLUG', label: 'Geschäftsreisen Flug', factorKg: 0.255, unit: 'km', source: 'UBA 2024', scope: 'SCOPE3', validYear: 2024, createdAt: new Date() },
];

/** Helper: GET to /api/emission-factors with query params */
function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/emission-factors');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/emission-factors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue(factors2024 as never);
  });

  it('GET_emissionFactors_withYearParam_returnsOnlyThatYearSorted', async () => {
    const req = makeRequest({ year: '2024' });
    const res = await GET(req);
    const data = (await res.json()) as unknown[];

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
    expect(prisma.emissionFactor.findMany).toHaveBeenCalledWith({
      where: { validYear: 2024 },
      orderBy: [{ scope: 'asc' }, { key: 'asc' }],
    });
  });

  it('GET_emissionFactors_resolvesFallbackLabel_fromStaticMap', async () => {
    // Factor with null label — should fall back to FACTOR_LABELS map
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { ...factors2024[0], label: null },
    ] as never);

    const req = makeRequest({ year: '2024' });
    const res = await GET(req);
    const data = (await res.json()) as Array<{ key: string; label: string }>;

    expect(data[0].label).toBe('Erdgas'); // from FACTOR_LABELS map
  });

  it('GET_emissionFactors_withMissingYearParam_returns400', async () => {
    const req = new NextRequest('http://localhost/api/emission-factors');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.findMany).not.toHaveBeenCalled();
  });

  it('GET_emissionFactors_withNonNumericYear_returns400', async () => {
    const req = makeRequest({ year: 'abc' });
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.findMany).not.toHaveBeenCalled();
  });
});
