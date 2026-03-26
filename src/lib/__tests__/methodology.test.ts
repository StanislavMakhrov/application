/**
 * Unit tests for assembleMethodologyData() (lib/methodology.ts).
 *
 * All DB access and factor lookups are mocked to keep tests fast and isolated.
 * Follows the same pattern as emissions.test.ts (mock prisma + mock factors).
 *
 * Test cases TC-01 through TC-13 as defined in
 * docs/features/002-methodology-summary/test-plan.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assembleMethodologyData } from '../methodology';

// Mock the Prisma client singleton
vi.mock('../prisma', () => ({
  prisma: {
    emissionEntry: {
      findMany: vi.fn(),
    },
    materialEntry: {
      findMany: vi.fn(),
    },
  },
}));

// Mock the factor record lookup so tests are independent of the DB
vi.mock('../factors', () => ({
  getEmissionFactorRecord: vi.fn(),
}));

import { prisma } from '../prisma';
import { getEmissionFactorRecord } from '../factors';

/** A minimal valid factor record returned by the mock */
const MOCK_FACTOR = {
  factorKg: 2.02,
  unit: 'm³',
  source: 'UBA Datenbericht 2024',
  validYear: 2024,
};

const STROM_FACTOR = {
  factorKg: 0.434,
  unit: 'kWh',
  source: 'UBA Datenbericht 2024',
  validYear: 2024,
};

/** Helper: build a minimal EmissionEntry shape */
function emissionEntry(overrides: {
  category: string;
  scope: string;
  inputMethod?: string;
  isFinalAnnual?: boolean;
  quantity?: number;
}) {
  return {
    category: overrides.category,
    scope: overrides.scope,
    inputMethod: overrides.inputMethod ?? 'MANUAL',
    isFinalAnnual: overrides.isFinalAnnual ?? false,
    quantity: overrides.quantity ?? 1000,
  };
}

/** Helper: build a minimal MaterialEntry shape */
function materialEntry(overrides: {
  material: string;
  inputMethod?: string;
  quantityKg?: number;
}) {
  return {
    material: overrides.material,
    inputMethod: overrides.inputMethod ?? 'MANUAL',
    quantityKg: overrides.quantityKg ?? 480,
  };
}

describe('assembleMethodologyData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty material entries
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValue([]);
  });

  // TC-01: standard is always GHG Protocol Corporate Standard
  it('TC-01: always returns GHG Protocol Corporate Standard as the standard', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1' }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.standard).toBe('GHG Protocol Corporate Standard');
  });

  // TC-02: single entry returns correct factorRow with all fields
  it('TC-02: single ERDGAS entry returns correct factorRow with all fields', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'MANUAL' }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.factorRows).toHaveLength(1);
    const row = result.factorRows[0];
    expect(row.categoryKey).toBe('ERDGAS');
    expect(row.scope).toBe('SCOPE1');
    expect(row.factorKg).toBe(2.02);
    expect(row.unit).toBe('m³');
    expect(row.source).toBe('UBA Datenbericht 2024');
    expect(row.validYear).toBe(2024);
  });

  // TC-03: only categories with recorded entries appear in factorRows
  it('TC-03: only categories with recorded entries appear in factorRows', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1' }),
      emissionEntry({ category: 'STROM', scope: 'SCOPE2' }),
    ]);
    vi.mocked(getEmissionFactorRecord)
      .mockResolvedValueOnce(MOCK_FACTOR)    // ERDGAS
      .mockResolvedValueOnce(STROM_FACTOR);  // STROM

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.factorRows).toHaveLength(2);
    const keys = result.factorRows.map((r) => r.categoryKey);
    expect(keys).toContain('ERDGAS');
    expect(keys).toContain('STROM');
  });

  // TC-04: single MANUAL entry produces MANUAL quality row
  it('TC-04: single MANUAL entry produces MANUAL quality row', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'STROM', scope: 'SCOPE2', inputMethod: 'MANUAL' }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(STROM_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.qualityRows).toHaveLength(1);
    expect(result.qualityRows[0].inputMethod).toBe('MANUAL');
  });

  // TC-05: single OCR entry produces OCR quality row
  it('TC-05: single OCR entry produces OCR quality row', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'OCR' }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.qualityRows[0].inputMethod).toBe('OCR');
  });

  // TC-06: profile boundaryNotes and exclusions are passed through
  it('TC-06: passes through boundaryNotes and exclusions from profile', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1' }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const profile = {
      reportingBoundaryNotes: 'Includes all DE sites',
      exclusions: 'Excludes foreign subsidiaries',
    };
    const result = await assembleMethodologyData(1, 2024, profile);
    expect(result.boundaryNotes).toBe('Includes all DE sites');
    expect(result.exclusions).toBe('Excludes foreign subsidiaries');
  });

  // TC-07: null profile boundary fields produce null in result
  it('TC-07: returns null for boundaryNotes and exclusions when both are null in profile', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1' }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {
      reportingBoundaryNotes: null,
      exclusions: null,
    });
    expect(result.boundaryNotes).toBeNull();
    expect(result.exclusions).toBeNull();
  });

  // TC-08: scopesIncluded is deduplicated
  it('TC-08: scopesIncluded is deduplicated across entries', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1' }),
      emissionEntry({ category: 'DIESEL_FUHRPARK', scope: 'SCOPE1' }),
      emissionEntry({ category: 'STROM', scope: 'SCOPE2' }),
    ]);
    vi.mocked(getEmissionFactorRecord)
      .mockResolvedValueOnce(MOCK_FACTOR)
      .mockResolvedValueOnce(MOCK_FACTOR)
      .mockResolvedValueOnce(STROM_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.scopesIncluded).toHaveLength(2);
    expect(result.scopesIncluded).toContain('SCOPE1');
    expect(result.scopesIncluded).toContain('SCOPE2');
    expect(result.scopesIncluded).not.toContain('SCOPE3');
  });

  // TC-09: missing factor produces null-value row without throwing
  it('TC-09: missing factor produces null-value row without throwing', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'UNKNOWN_CATEGORY', scope: 'SCOPE1' }),
    ]);
    // Factor not found
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(null);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.factorRows).toHaveLength(1);
    const row = result.factorRows[0];
    expect(row.factorKg).toBeNull();
    expect(row.source).toBeNull();
    expect(row.validYear).toBeNull();
  });

  // TC-10: isFinalAnnual=true suppresses isFinalAnnual=false rows for same category
  it('TC-10: isFinalAnnual=true entry suppresses monthly entries for same category', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'STROM', scope: 'SCOPE2', inputMethod: 'MANUAL', isFinalAnnual: true, quantity: 12000 }),
      emissionEntry({ category: 'STROM', scope: 'SCOPE2', inputMethod: 'OCR', isFinalAnnual: false, quantity: 1000 }),
      emissionEntry({ category: 'STROM', scope: 'SCOPE2', inputMethod: 'OCR', isFinalAnnual: false, quantity: 1050 }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(STROM_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    // Only the final-annual entry contributes — one row for STROM
    expect(result.factorRows).toHaveLength(1);
    expect(result.qualityRows).toHaveLength(1);
    // inputMethod from the final-annual row (MANUAL), monthly OCR rows are skipped
    expect(result.qualityRows[0].inputMethod).toBe('MANUAL');
  });

  // TC-11: OCR > CSV > MANUAL input method priority
  it('TC-11a: OCR wins over MANUAL when multiple entries exist for same category', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'MANUAL', isFinalAnnual: false }),
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'OCR', isFinalAnnual: false }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.qualityRows[0].inputMethod).toBe('OCR');
  });

  it('TC-11b: CSV wins over MANUAL when multiple entries exist for same category', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'MANUAL', isFinalAnnual: false }),
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'CSV', isFinalAnnual: false }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.qualityRows[0].inputMethod).toBe('CSV');
  });

  it('TC-11c: OCR wins over CSV and MANUAL', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'MANUAL', isFinalAnnual: false }),
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'CSV', isFinalAnnual: false }),
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'OCR', isFinalAnnual: false }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.qualityRows[0].inputMethod).toBe('OCR');
  });

  it('TC-11d: MANUAL stays MANUAL when all entries are MANUAL', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'MANUAL', isFinalAnnual: false }),
      emissionEntry({ category: 'ERDGAS', scope: 'SCOPE1', inputMethod: 'MANUAL', isFinalAnnual: false }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce(MOCK_FACTOR);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.qualityRows[0].inputMethod).toBe('MANUAL');
  });

  // TC-12: empty entries return empty arrays, standard still set
  it('TC-12: no entries returns empty arrays with standard still set', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([]);

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.factorRows).toHaveLength(0);
    expect(result.qualityRows).toHaveLength(0);
    expect(result.scopesIncluded).toHaveLength(0);
    expect(result.standard).toBe('GHG Protocol Corporate Standard');
  });

  // TC-13: MaterialEntry rows appear with SCOPE3
  it('TC-13: MaterialEntry rows appear in factorRows and qualityRows with scope SCOPE3', async () => {
    vi.mocked(prisma.emissionEntry.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.materialEntry.findMany).mockResolvedValueOnce([
      materialEntry({ material: 'KUPFER', inputMethod: 'CSV', quantityKg: 480 }),
    ]);
    vi.mocked(getEmissionFactorRecord).mockResolvedValueOnce({
      factorKg: 3.2,
      unit: 'kg',
      source: 'UBA Datenbericht 2024',
      validYear: 2024,
    });

    const result = await assembleMethodologyData(1, 2024, {});
    expect(result.factorRows).toHaveLength(1);
    expect(result.factorRows[0].categoryKey).toBe('KUPFER');
    expect(result.factorRows[0].scope).toBe('SCOPE3');
    expect(result.qualityRows[0].inputMethod).toBe('CSV');
    expect(result.scopesIncluded).toContain('SCOPE3');
  });
});
