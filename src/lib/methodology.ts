/**
 * Methodology data assembly for the GHG Protocol PDF report.
 *
 * This module assembles the "Methodik & Datenqualität" block from existing
 * database records at report-generation time. It follows the same architectural
 * pattern as emissions.ts — all DB access and assembly logic lives in lib/,
 * keeping the GHGReport component purely presentational.
 *
 * Key design decisions:
 * - Missing emission factors degrade gracefully (null placeholders, no crash)
 * - isFinalAnnual logic mirrors getTotalCO2e() to avoid double-counting
 * - InputMethod priority OCR > CSV > MANUAL reflects data confidence
 * - MaterialEntry rows always use SCOPE3 (no scope column in schema)
 */

import { prisma } from './prisma';
import { getEmissionFactorRecord } from './factors';
import {
  CATEGORY_LABELS,
  CATEGORY_UNITS,
  MATERIAL_LABELS,
  MATERIAL_UNITS,
} from '@/types';
import type { MethodologyData, MethodologyFactorRow, MethodologyQualityRow, Scope, InputMethod } from '@/types';

/** Priority order for input method selection (highest index = highest priority) */
const INPUT_METHOD_PRIORITY: Record<InputMethod, number> = {
  MANUAL: 0,
  CSV: 1,
  OCR: 2,
};

/**
 * Returns the higher-priority input method of two, per OCR > CSV > MANUAL.
 */
function higherPriority(a: InputMethod, b: InputMethod): InputMethod {
  return INPUT_METHOD_PRIORITY[a] >= INPUT_METHOD_PRIORITY[b] ? a : b;
}

/**
 * Assembles methodology data for the GHG Protocol PDF report.
 *
 * For each category with a recorded EmissionEntry or MaterialEntry:
 * - Looks up the full EmissionFactor record (factorKg, unit, source, validYear)
 * - Collects the inputMethod, using OCR > CSV > MANUAL when multiple entries exist
 *
 * Applies the same isFinalAnnual filtering as getTotalCO2e() to avoid
 * counting monthly entries when an annual summary entry exists.
 *
 * @param yearId  - Database ID of the ReportingYear
 * @param year    - Calendar year for emission factor lookup
 * @param profile - CompanyProfile fields for boundary notes and exclusions
 * @returns MethodologyData ready to be passed as a prop to GHGReport
 */
export async function assembleMethodologyData(
  yearId: number,
  year: number,
  profile: { reportingBoundaryNotes?: string | null; exclusions?: string | null }
): Promise<MethodologyData> {
  // Fetch all emission and material entries for the reporting year
  const emissionEntries = await prisma.emissionEntry.findMany({
    where: { reportingYearId: yearId },
  });

  const materialEntries = await prisma.materialEntry.findMany({
    where: { reportingYearId: yearId },
  });

  // --- isFinalAnnual filtering (mirrors getTotalCO2e logic) ---
  // If a category has a isFinalAnnual=true row, skip all isFinalAnnual=false rows.
  // This prevents monthly billing entries from appearing alongside the annual total.
  // eslint-disable-next-line
  const finalAnnualCategories = new Set<string>(
    // eslint-disable-next-line
    (emissionEntries as any[]).filter((e) => e.isFinalAnnual).map((e) => e.category as string)
  );

  // eslint-disable-next-line
  const filteredEmissions = (emissionEntries as any[]).filter(
    (e) => !finalAnnualCategories.has(e.category) || e.isFinalAnnual
  );

  // --- Aggregate per emission category ---
  // Track inputMethod (highest priority) and scope for each category key.
  const emissionCategoryMap = new Map<string, { inputMethod: InputMethod; scope: Scope }>();

  for (const entry of filteredEmissions) {
    const key = entry.category as string;
    const method = entry.inputMethod as InputMethod;
    const scope = entry.scope as Scope;

    const existing = emissionCategoryMap.get(key);
    if (!existing) {
      emissionCategoryMap.set(key, { inputMethod: method, scope });
    } else {
      // Keep highest-priority inputMethod across multiple entries for the same category
      emissionCategoryMap.set(key, {
        inputMethod: higherPriority(existing.inputMethod, method),
        scope: existing.scope,
      });
    }
  }

  // --- Aggregate per material category ---
  // MaterialEntry has no scope column — materials are always SCOPE3.
  const materialCategoryMap = new Map<string, { inputMethod: InputMethod }>();

  // eslint-disable-next-line
  for (const mat of materialEntries as any[]) {
    const key = mat.material as string;
    const method = mat.inputMethod as InputMethod;

    const existing = materialCategoryMap.get(key);
    if (!existing) {
      materialCategoryMap.set(key, { inputMethod: method });
    } else {
      materialCategoryMap.set(key, {
        inputMethod: higherPriority(existing.inputMethod, method),
      });
    }
  }

  // --- Build factor and quality rows ---
  const factorRows: MethodologyFactorRow[] = [];
  const qualityRows: MethodologyQualityRow[] = [];
  const scopesSet = new Set<Scope>();

  // Emission categories
  for (const [categoryKey, { inputMethod, scope }] of Array.from(emissionCategoryMap.entries())) {
    const record = await getEmissionFactorRecord(categoryKey, year);
    const categoryLabel =
      (CATEGORY_LABELS as Record<string, string>)[categoryKey] ?? categoryKey;

    factorRows.push({
      categoryKey,
      categoryLabel,
      scope,
      factorKg: record?.factorKg ?? null,
      // Fall back to CATEGORY_UNITS lookup when record is unavailable
      unit: record?.unit ?? (CATEGORY_UNITS as Record<string, string>)[categoryKey] ?? '—',
      source: record?.source ?? null,
      validYear: record?.validYear ?? null,
    });

    qualityRows.push({ categoryKey, categoryLabel, inputMethod });
    scopesSet.add(scope);
  }

  // Material categories (always SCOPE3)
  for (const [categoryKey, { inputMethod }] of Array.from(materialCategoryMap.entries())) {
    const record = await getEmissionFactorRecord(categoryKey, year);
    const categoryLabel =
      (MATERIAL_LABELS as Record<string, string>)[categoryKey] ?? categoryKey;

    factorRows.push({
      categoryKey,
      categoryLabel,
      scope: 'SCOPE3',
      factorKg: record?.factorKg ?? null,
      unit: record?.unit ?? (MATERIAL_UNITS as Record<string, string>)[categoryKey] ?? '—',
      source: record?.source ?? null,
      validYear: record?.validYear ?? null,
    });

    qualityRows.push({ categoryKey, categoryLabel, inputMethod });
    scopesSet.add('SCOPE3');
  }

  return {
    standard: 'GHG Protocol Corporate Standard',
    scopesIncluded: Array.from(scopesSet),
    factorRows,
    qualityRows,
    boundaryNotes: profile.reportingBoundaryNotes ?? null,
    exclusions: profile.exclusions ?? null,
  };
}
