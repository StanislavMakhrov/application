/**
 * Unit tests for src/lib/methodology.ts
 *
 * Mocks Prisma to test the assembly logic in isolation:
 * - factor source label determination (UBA vs Benutzerdefiniert)
 * - scope inclusion rules (quantity ≠ 0)
 * - input method counting
 * - label fallback chain (DB → FACTOR_LABELS → raw key)
 * - edge cases: no factors, no entries
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMethodologyData } from '../methodology';

vi.mock('../prisma', () => ({
  prisma: {
    reportingYear: { findUnique: vi.fn() },
    emissionFactor: { findMany: vi.fn() },
    emissionEntry: { findMany: vi.fn() },
    companyProfile: { findUnique: vi.fn() },
  },
}));

import { prisma } from '../prisma';

const mockYear = { id: 1, year: 2024, createdAt: new Date() };
const mockProfile = {
  id: 1,
  reportingBoundaryNotes: 'Alle Standorte in Deutschland',
  exclusions: 'Keine Ausschlüsse',
};

const baseFactors = [
  { id: 1, key: 'ERDGAS', label: 'Erdgas', factorKg: 2.0, unit: 'm³', source: 'UBA 2024', scope: 'SCOPE1', validYear: 2024, createdAt: new Date() },
  { id: 2, key: 'STROM', label: 'Strom (Netzstrom)', factorKg: 0.38, unit: 'kWh', source: 'UBA 2024', scope: 'SCOPE2', validYear: 2024, createdAt: new Date() },
];

const baseEntries = [
  { scope: 'SCOPE1', quantity: 1000, inputMethod: 'MANUAL' },
  { scope: 'SCOPE2', quantity: 5000, inputMethod: 'OCR' },
  { scope: 'SCOPE3', quantity: 0, inputMethod: 'MANUAL' }, // zero — should be excluded
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.reportingYear.findUnique).mockResolvedValue(mockYear as never);
  vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue(baseFactors as never);
  vi.mocked(prisma.emissionEntry.findMany).mockResolvedValue(baseEntries as never);
  vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockProfile as never);
});

describe('getMethodologyData', () => {
  it('returns standard as GHG Protocol Corporate Standard', async () => {
    const result = await getMethodologyData(1);
    expect(result.standard).toBe('GHG Protocol Corporate Standard');
  });

  it('sets factorSourceLabel to "UBA 2024 Emissionsfaktoren" when all sources are UBA', async () => {
    const result = await getMethodologyData(1);
    expect(result.factorSourceLabel).toBe('UBA 2024 Emissionsfaktoren');
  });

  it('sets factorSourceLabel to "Benutzerdefiniert 2024" when any source differs', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      ...baseFactors,
      { id: 3, key: 'DIESEL_FUHRPARK', label: null, factorKg: 2.9, unit: 'L', source: 'Benutzerdefiniert 2024', scope: 'SCOPE1', validYear: 2024, createdAt: new Date() },
    ] as never);
    const result = await getMethodologyData(1);
    expect(result.factorSourceLabel).toBe('Benutzerdefiniert 2024');
  });

  it('includes only scopes with quantity ≠ 0', async () => {
    const result = await getMethodologyData(1);
    expect(result.includedScopes).toContain('SCOPE1');
    expect(result.includedScopes).toContain('SCOPE2');
    expect(result.includedScopes).not.toContain('SCOPE3'); // quantity = 0
  });

  it('counts input methods correctly', async () => {
    const result = await getMethodologyData(1);
    expect(result.inputMethodCounts.manual).toBe(2); // SCOPE1 + SCOPE3 entries
    expect(result.inputMethodCounts.ocr).toBe(1);
    expect(result.inputMethodCounts.csv).toBe(0);
  });

  it('returns assumptions and exclusions from company profile', async () => {
    const result = await getMethodologyData(1);
    expect(result.assumptions).toBe('Alle Standorte in Deutschland');
    expect(result.exclusions).toBe('Keine Ausschlüsse');
  });

  it('falls back to FACTOR_LABELS when DB label is null', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { id: 1, key: 'ERDGAS', label: null, factorKg: 2.0, unit: 'm³', source: 'UBA 2024', scope: 'SCOPE1', validYear: 2024, createdAt: new Date() },
    ] as never);
    const result = await getMethodologyData(1);
    expect(result.factors[0].label).toBe('Erdgas');
  });

  it('falls back to raw key when no label found at all', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([
      { id: 99, key: 'UNKNOWN_CUSTOM_KEY', label: null, factorKg: 1.0, unit: 'kg', source: 'UBA 2024', scope: 'SCOPE1', validYear: 2024, createdAt: new Date() },
    ] as never);
    const result = await getMethodologyData(1);
    expect(result.factors[0].label).toBe('UNKNOWN_CUSTOM_KEY');
  });

  it('returns empty factors and empty scopes when no data exists', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValue([] as never);
    const result = await getMethodologyData(1);
    expect(result.factors).toEqual([]);
    expect(result.includedScopes).toEqual([]);
    expect(result.inputMethodCounts).toEqual({ manual: 0, ocr: 0, csv: 0 });
  });

  it('handles null company profile gracefully', async () => {
    vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(null as never);
    const result = await getMethodologyData(1);
    expect(result.assumptions).toBeNull();
    expect(result.exclusions).toBeNull();
  });
});
