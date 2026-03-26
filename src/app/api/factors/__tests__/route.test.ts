/**
 * Unit tests for GET /api/factors route (TC-05, TC-06, TC-07).
 *
 * Mocks getAllEmissionFactorRecords to test route-level validation and
 * error handling without a live database.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the factors lib to avoid DB access
vi.mock('@/lib/factors', () => ({
  getAllEmissionFactorRecords: vi.fn(),
}));

import { getAllEmissionFactorRecords } from '@/lib/factors';

const mockFactors = {
  ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 },
  STROM: { factorKg: 0.434, unit: 'kWh', source: 'UBA 2024', validYear: 2024 },
};

function makeRequest(searchParams: string): NextRequest {
  return new NextRequest(`http://localhost/api/factors${searchParams}`);
}

describe('GET /api/factors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-05: Valid year returns 200 with factor map
  it('TC-05: returns 200 with factor map for a valid year param', async () => {
    vi.mocked(getAllEmissionFactorRecords).mockResolvedValueOnce(mockFactors);

    const res = await GET(makeRequest('?year=2024'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockFactors);
    expect(getAllEmissionFactorRecords).toHaveBeenCalledWith(2024);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  // TC-06: Missing year param returns 400
  it('TC-06: returns 400 when year param is missing', async () => {
    const res = await GET(makeRequest(''));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'year ist erforderlich' });
    expect(getAllEmissionFactorRecords).not.toHaveBeenCalled();
  });

  // TC-07: Non-numeric year param returns 400
  it('TC-07: returns 400 when year param is non-numeric', async () => {
    const res = await GET(makeRequest('?year=abc'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'year ist erforderlich' });
    expect(getAllEmissionFactorRecords).not.toHaveBeenCalled();
  });

  // Additional: DB error returns 500
  it('returns 500 when getAllEmissionFactorRecords throws', async () => {
    vi.mocked(getAllEmissionFactorRecords).mockRejectedValueOnce(new Error('DB down'));

    const res = await GET(makeRequest('?year=2024'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Faktoren konnten nicht geladen werden' });
  });
});
