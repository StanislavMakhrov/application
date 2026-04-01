/**
 * Methodology service — assembles MethodologyData from live database records.
 *
 * Used by:
 * - /api/methodology (REST endpoint for the UI)
 * - /api/report (PDF generation)
 * - src/app/page.tsx (dashboard MethodologySummary component)
 *
 * Assembly uses three DB queries: emission factors for the year, emission
 * entries grouped by scope/inputMethod, and the company profile for
 * assumptions text.
 */

import { prisma } from '@/lib/prisma';
import { FACTOR_LABELS } from '@/lib/factor-labels';

export interface MethodologyFactor {
  key: string;
  /** German display label (DB field → FACTOR_LABELS fallback → raw key) */
  label: string;
  factorKg: number;
  unit: string;
  scope: string;
  /** "UBA {year}" or "Benutzerdefiniert {year}" */
  source: string;
}

export interface MethodologyData {
  /** Always "GHG Protocol Corporate Standard" */
  standard: string;
  /**
   * "UBA {year} Emissionsfaktoren" when all factors share the same UBA source,
   * otherwise "Benutzerdefiniert {year}" (conservative for audit defensibility).
   */
  factorSourceLabel: string;
  factorYear: number;
  /**
   * Only scopes that have at least one entry with quantity ≠ 0.
   * Empty scopes are omitted to keep the methodology block accurate.
   */
  includedScopes: ('SCOPE1' | 'SCOPE2' | 'SCOPE3')[];
  inputMethodCounts: {
    manual: number;
    ocr: number;
    csv: number;
  };
  /** CompanyProfile.reportingBoundaryNotes — null if unset */
  assumptions: string | null;
  /** CompanyProfile.exclusions — null if unset */
  exclusions: string | null;
  factors: MethodologyFactor[];
}

/**
 * Assembles a complete MethodologyData object for the given reporting year.
 *
 * @param yearId - The ReportingYear.id (primary key), not the calendar year.
 *                 Callers should pass `currentYearRecord.id` from the dashboard.
 */
export async function getMethodologyData(yearId: number): Promise<MethodologyData> {
  // Resolve yearId → calendar year for factor lookup and source label
  const reportingYear = await prisma.reportingYear.findUnique({
    where: { id: yearId },
  });

  const factorYear = reportingYear?.year ?? new Date().getFullYear();

  // Query 1: All emission factors for this calendar year
  const dbFactors = await prisma.emissionFactor.findMany({
    where: { validYear: factorYear },
    orderBy: [{ scope: 'asc' }, { key: 'asc' }],
  });

  // Query 2: All emission entries for this reporting year
  const entries = await prisma.emissionEntry.findMany({
    where: { reportingYearId: yearId },
    select: { scope: true, quantity: true, inputMethod: true },
  });

  // Query 3: Company profile for assumptions text
  const profile = await prisma.companyProfile.findUnique({ where: { id: 1 } });

  // --- Resolve factor source label (conservative: one override → full "Benutzerdefiniert") ---
  const expectedUbaSource = `UBA ${factorYear}`;
  const hasCustomFactor = dbFactors.some((f) => f.source !== expectedUbaSource);
  const factorSourceLabel = hasCustomFactor
    ? `Benutzerdefiniert ${factorYear}`
    : `UBA ${factorYear} Emissionsfaktoren`;

  // --- Determine included scopes (at least one entry with quantity ≠ 0) ---
  const scopeSet = new Set<'SCOPE1' | 'SCOPE2' | 'SCOPE3'>();
  for (const entry of entries) {
    if (entry.quantity !== 0) {
      scopeSet.add(entry.scope as 'SCOPE1' | 'SCOPE2' | 'SCOPE3');
    }
  }
  // Return scopes in canonical order
  const SCOPE_ORDER: ('SCOPE1' | 'SCOPE2' | 'SCOPE3')[] = ['SCOPE1', 'SCOPE2', 'SCOPE3'];
  const includedScopes = SCOPE_ORDER.filter((s) => scopeSet.has(s));

  // --- Count entries by input method ---
  const inputMethodCounts = { manual: 0, ocr: 0, csv: 0 };
  for (const entry of entries) {
    if (entry.inputMethod === 'MANUAL') inputMethodCounts.manual += 1;
    else if (entry.inputMethod === 'OCR') inputMethodCounts.ocr += 1;
    else if (entry.inputMethod === 'CSV') inputMethodCounts.csv += 1;
  }

  // --- Build factor list with label resolution ---
  const factors: MethodologyFactor[] = dbFactors.map((f) => ({
    key: f.key,
    // Priority: DB label → static fallback → raw key
    label: f.label ?? FACTOR_LABELS[f.key] ?? f.key,
    factorKg: f.factorKg,
    unit: f.unit,
    scope: f.scope,
    source: f.source,
  }));

  return {
    standard: 'GHG Protocol Corporate Standard',
    factorSourceLabel,
    factorYear,
    includedScopes,
    inputMethodCounts,
    assumptions: profile?.reportingBoundaryNotes ?? null,
    exclusions: profile?.exclusions ?? null,
    factors,
  };
}
