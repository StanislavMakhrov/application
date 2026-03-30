/**
 * API route tests for POST /api/emission-factors/uba-fill
 *
 * Covers TC-08, TC-09, TC-10 from the test plan:
 * - TC-08: Full upsert of all reference factors for the requested year
 * - TC-09: Year isolation — only the requested year's validYear is written (Explicit Constraint)
 * - TC-10: 400 error and no DB writes for an unknown year
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emissionFactor: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { UBA_REFERENCE_DATA } from '@/lib/uba-reference-data';

/** Helper: POST to /api/emission-factors/uba-fill with a JSON body */
function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/emission-factors/uba-fill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/emission-factors/uba-fill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.emissionFactor.upsert).mockResolvedValue({} as never);
  });

  it('POST_ubaFill_withValidYear_upsertsAllReferenceFactors', async () => {
    const req = makeRequest({ year: 2024 });
    const res = await POST(req);
    const data = (await res.json()) as { upsertedCount: number };

    expect(res.status).toBe(200);
    expect(data.upsertedCount).toBe(UBA_REFERENCE_DATA[2024].length);
    expect(prisma.emissionFactor.upsert).toHaveBeenCalledTimes(UBA_REFERENCE_DATA[2024].length);
  });

  /**
   * TC-09 — Year isolation (Explicit Constraint from specification):
   * "factors for one reporting year MUST NOT silently overwrite or be confused with
   * factors for another year."
   *
   * Verifies that every upsert call uses validYear = 2024 exclusively.
   */
  it('POST_ubaFill_forYear2024_neverWritesToOtherYears', async () => {
    const req = makeRequest({ year: 2024 });
    await POST(req);

    const calls = vi.mocked(prisma.emissionFactor.upsert).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    for (const [args] of calls) {
      // The upsert `where` clause must target validYear 2024 only
      expect(args.where.key_validYear.validYear).toBe(2024);
      // The upsert `create` data must also carry validYear 2024
      expect(args.create.validYear).toBe(2024);
    }
  });

  it('POST_ubaFill_withUnknownYear_returns400WithoutWriting', async () => {
    const req = makeRequest({ year: 2099 });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.upsert).not.toHaveBeenCalled();
  });

  it('POST_ubaFill_withMissingYear_returns400', async () => {
    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.upsert).not.toHaveBeenCalled();
  });

  it('POST_ubaFill_withNonFiniteYear_returns400', async () => {
    const req = makeRequest({ year: Infinity });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.upsert).not.toHaveBeenCalled();
  });

  it('POST_ubaFill_withInvalidJsonBody_returns400', async () => {
    const req = new NextRequest('http://localhost/api/emission-factors/uba-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.upsert).not.toHaveBeenCalled();
  });

  it('POST_ubaFill_setsCorrectSourceLabels', async () => {
    const req = makeRequest({ year: 2024 });
    await POST(req);

    const calls = vi.mocked(prisma.emissionFactor.upsert).mock.calls;
    for (const [args] of calls) {
      // Source must be "UBA 2024" for the fill, not "Benutzerdefiniert"
      expect(args.update.source).toBe('UBA 2024');
      expect(args.create.source).toBe('UBA 2024');
    }
  });
});
