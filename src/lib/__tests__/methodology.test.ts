/**
 * Unit tests for the methodology assembler (lib/methodology.ts).
 *
 * All Prisma calls are mocked to keep tests fast and DB-independent.
 * Key cases covered:
 * - Scope coverage derived from emission entries
 * - Scope 3 coverage from material entries
 * - Data quality breakdown (MANUAL / OCR / CSV)
 * - Boundary fields from company profile
 * - Graceful fallback when the DB throws
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assembleMethodology } from '../methodology';

vi.mock('../prisma', () => ({
  prisma: {
    reportingYear: {
      findUnique: vi.fn(),
    },
    emissionEntry: {
      findMany: vi.fn(),
    },
    materialEntry: {
      findMany: vi.fn(),
    },
    companyProfile: {
      findUnique: vi.fn(),
    },
    emissionFactor: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../prisma';

describe('assembleMethodology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct scope coverage from emission entries', async () => {
    vi.mocked(prisma.reportingYear.findUnique).mockResolvedValueOnce({ id: 1, year: 2024, createdAt: new Date() });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      { scope: 'SCOPE1', category: 'ERDGAS', inputMethod: 'MANUAL' },
      { scope: 'SCOPE2', category: 'STROM', inputMethod: 'OCR' },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.companyProfile.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce({ source: 'UBA 2024', validYear: 2024 });

    const result = await assembleMethodology(1);
    expect(result.scopesCovered.scope1).toContain('Erdgas');
    expect(result.scopesCovered.scope2).toContain('Strom');
    expect(result.scopesCovered.scope3).toHaveLength(0);
  });

  it('counts data quality breakdown correctly', async () => {
    vi.mocked(prisma.reportingYear.findUnique).mockResolvedValueOnce({ id: 1, year: 2024, createdAt: new Date() });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      { scope: 'SCOPE1', category: 'ERDGAS', inputMethod: 'MANUAL' },
      { scope: 'SCOPE1', category: 'HEIZOEL', inputMethod: 'OCR' },
      { scope: 'SCOPE3', category: 'ABFALL_RESTMUELL', inputMethod: 'CSV' },
    ]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([
      { material: 'KUPFER', inputMethod: 'MANUAL' },
    ]);
    vi.mocked(prisma.companyProfile.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce(null);

    const result = await assembleMethodology(1);
    expect(result.dataQuality.manual).toBe(2);       // ERDGAS + KUPFER
    expect(result.dataQuality.ocrExtracted).toBe(1); // HEIZOEL
    expect(result.dataQuality.estimated).toBe(1);    // ABFALL_RESTMUELL (CSV)
    expect(result.dataQuality.total).toBe(4);
  });

  it('returns placeholder boundary when company profile is null', async () => {
    vi.mocked(prisma.reportingYear.findUnique).mockResolvedValueOnce({ id: 1, year: 2024, createdAt: new Date() });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.companyProfile.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce(null);

    const result = await assembleMethodology(1);
    expect(result.boundary.companyName).toBeNull();
    expect(result.boundary.reportingYear).toBe(2024);
  });

  it('uses company profile data when available', async () => {
    vi.mocked(prisma.reportingYear.findUnique).mockResolvedValueOnce({ id: 1, year: 2024, createdAt: new Date() });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.companyProfile.findUnique).mockResolvedValueOnce({
      id: 1,
      firmenname: 'Test GmbH',
      mitarbeiter: 15,
      standort: 'Berlin',
      branche: 'ELEKTROHANDWERK',
      updatedAt: new Date(),
    });
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce({ source: 'UBA 2024', validYear: 2024 });

    const result = await assembleMethodology(1);
    expect(result.boundary.companyName).toBe('Test GmbH');
    expect(result.boundary.employees).toBe(15);
  });

  it('returns fallback object when an unexpected error occurs', async () => {
    vi.mocked(prisma.reportingYear.findUnique).mockRejectedValueOnce(new Error('DB error'));

    const result = await assembleMethodology(1);
    expect(result.standard).toBe('GHG Protocol Corporate Standard');
    expect(result.engineVersion).toBeTruthy();
  });

  it('includes material categories in scope3 coverage', async () => {
    vi.mocked(prisma.reportingYear.findUnique).mockResolvedValueOnce({ id: 1, year: 2024, createdAt: new Date() });
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([
      { material: 'KUPFER', inputMethod: 'MANUAL' },
      { material: 'STAHL', inputMethod: 'MANUAL' },
    ]);
    vi.mocked(prisma.companyProfile.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce(null);

    const result = await assembleMethodology(1);
    expect(result.scopesCovered.scope3).toContain('Kupfer');
    expect(result.scopesCovered.scope3).toContain('Stahl');
  });
});
