/**
 * API route tests for PUT /api/emission-factors/[id]
 *
 * Covers TC-07 from the test plan:
 * - TC-07: Updates factor value and sets source to "Benutzerdefiniert {validYear}"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from './route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emissionFactor: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const existingFactor = {
  id: 5,
  key: 'STROM',
  validYear: 2024,
  factorKg: 0.38,
  unit: 'kWh',
  source: 'UBA 2024',
  label: 'Strom (Netzstrom)',
  scope: 'SCOPE2',
  createdAt: new Date(),
};

/** Helper: PUT to /api/emission-factors/5 with a JSON body */
function makeRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/emission-factors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/emission-factors/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValue(existingFactor as never);
    vi.mocked(prisma.emissionFactor.update).mockResolvedValue({
      ...existingFactor,
      factorKg: 0.2,
      source: 'Benutzerdefiniert 2024',
    } as never);
  });

  it('PUT_emissionFactorId_withValidValue_updatesFactorAndSetsCustomSource', async () => {
    const req = makeRequest('5', { factorKg: 0.2 });
    const res = await PUT(req, { params: Promise.resolve({ id: '5' }) });

    expect(res.status).toBe(200);
    expect(prisma.emissionFactor.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        factorKg: 0.2,
        source: 'Benutzerdefiniert 2024',
      },
    });
  });

  it('PUT_emissionFactorId_withNegativeValue_succeeds', async () => {
    // Negative factors (recycling credits) are valid
    vi.mocked(prisma.emissionFactor.update).mockResolvedValue({
      ...existingFactor,
      factorKg: -1.5,
      source: 'Benutzerdefiniert 2024',
    } as never);

    const req = makeRequest('5', { factorKg: -1.5 });
    const res = await PUT(req, { params: Promise.resolve({ id: '5' }) });

    expect(res.status).toBe(200);
    expect(prisma.emissionFactor.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ factorKg: -1.5 }) })
    );
  });

  it('PUT_emissionFactorId_withInvalidId_returns400', async () => {
    const req = makeRequest('abc', { factorKg: 0.2 });
    const res = await PUT(req, { params: Promise.resolve({ id: 'abc' }) });

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.update).not.toHaveBeenCalled();
  });

  it('PUT_emissionFactorId_withMissingFactorKg_returns400', async () => {
    const req = makeRequest('5', {});
    const res = await PUT(req, { params: Promise.resolve({ id: '5' }) });

    expect(res.status).toBe(400);
    expect(prisma.emissionFactor.update).not.toHaveBeenCalled();
  });

  it('PUT_emissionFactorId_withNaNFactorKg_returns400', async () => {
    const req = makeRequest('5', { factorKg: NaN });
    const res = await PUT(req, { params: Promise.resolve({ id: '5' }) });

    expect(res.status).toBe(400);
  });

  it('PUT_emissionFactorId_forNonExistentFactor_returns404', async () => {
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValue(null as never);

    const req = makeRequest('999', { factorKg: 0.2 });
    const res = await PUT(req, { params: Promise.resolve({ id: '999' }) });

    expect(res.status).toBe(404);
    expect(prisma.emissionFactor.update).not.toHaveBeenCalled();
  });
});
