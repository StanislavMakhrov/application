/**
 * API route tests for GET /api/methodology?yearId={yearId}
 *
 * Covers TC-13, TC-14 from the test plan:
 * - TC-13: Returns MethodologyData for a valid yearId
 * - TC-14: Returns 400 when yearId is missing or invalid
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock the Prisma client used by the route (for the existence check)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    reportingYear: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock getMethodologyData to isolate the route handler from the service layer
vi.mock('@/lib/methodology', () => ({
  getMethodologyData: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getMethodologyData } from '@/lib/methodology';

const mockMethodologyData = {
  standard: 'GHG Protocol Corporate Standard',
  factorSourceLabel: 'UBA 2024 Emissionsfaktoren',
  factorYear: 2024,
  includedScopes: ['SCOPE1', 'SCOPE2'],
  inputMethodCounts: { manual: 5, ocr: 2, csv: 0 },
  assumptions: null,
  exclusions: null,
  factors: [],
};

/** Helper: GET to /api/methodology with query params */
function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/methodology');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/methodology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.reportingYear.findUnique).mockResolvedValue({ id: 1, year: 2024, createdAt: new Date() } as never);
    vi.mocked(getMethodologyData).mockResolvedValue(mockMethodologyData as never);
  });

  it('GET_methodology_withValidYearId_returnsMethodologyData', async () => {
    const req = makeRequest({ yearId: '1' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.standard).toBe('GHG Protocol Corporate Standard');
    expect(data.factorSourceLabel).toBe('UBA 2024 Emissionsfaktoren');
    expect(data).toHaveProperty('includedScopes');
    expect(data).toHaveProperty('inputMethodCounts');
    expect(data).toHaveProperty('factors');
    expect(getMethodologyData).toHaveBeenCalledWith(1);
  });

  it('GET_methodology_withoutYearId_returns400', async () => {
    const req = new NextRequest('http://localhost/api/methodology');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(getMethodologyData).not.toHaveBeenCalled();
  });

  it('GET_methodology_withNonNumericYearId_returns400', async () => {
    const req = makeRequest({ yearId: 'abc' });
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(getMethodologyData).not.toHaveBeenCalled();
  });

  it('GET_methodology_withNonExistentYearId_returns404', async () => {
    vi.mocked(prisma.reportingYear.findUnique).mockResolvedValue(null as never);

    const req = makeRequest({ yearId: '999' });
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(getMethodologyData).not.toHaveBeenCalled();
  });
});
