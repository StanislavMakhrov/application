/**
 * Methodology assembler for GrünBilanz reports.
 *
 * Builds a MethodologyData object from existing database records.
 * All fields degrade gracefully — missing data produces German placeholders.
 * This function never throws; errors produce a minimal fallback object.
 */

import { prisma } from './prisma';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '@/types';
import type { MethodologyData } from '@/types';

// Read the engine version from the environment variable injected by npm,
// or fall back to '0.1.0'. This fallback is intentionally frozen for non-npm
// invocations (e.g. unit tests, docker exec) where npm_package_version is absent.
const ENGINE_VERSION = process.env.npm_package_version ?? '0.1.0';

const FALLBACK_METHODOLOGY: MethodologyData = {
  standard: 'GHG Protocol Corporate Standard',
  factorSet: { name: 'UBA 2024', source: 'Umweltbundesamt', year: 2024 },
  scopesCovered: { scope1: [], scope2: [], scope3: [] },
  dataQuality: { manual: 0, ocrExtracted: 0, estimated: 0, total: 0 },
  boundary: { companyName: null, reportingYear: 0, employees: null },
  assumptions: null,
  engineVersion: ENGINE_VERSION,
};

/** Returns the reporting year integer or 0 on error */
async function getYear(yearId: number): Promise<number> {
  try {
    const ry = await prisma.reportingYear.findUnique({ where: { id: yearId } });
    return ry?.year ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Assembles methodology data for a given reporting year.
 *
 * Reads emission entries, material entries, company profile, and emission
 * factors from the database to build a complete MethodologyData description.
 * Returns a fallback object if any error occurs so PDF generation is never
 * blocked by methodology assembly failures.
 */
export async function assembleMethodology(yearId: number): Promise<MethodologyData> {
  try {
    const year = await getYear(yearId);

    // --- Emission entries ---
    const entries = await prisma.emissionEntry.findMany({
      where: { reportingYearId: yearId },
      select: { scope: true, category: true, inputMethod: true },
    });

    // --- Material entries ---
    const materials = await prisma.materialEntry.findMany({
      where: { reportingYearId: yearId },
      select: { material: true, inputMethod: true },
    });

    // --- Company profile ---
    const profile = await prisma.companyProfile.findUnique({ where: { id: 1 } });

    // --- Emission factor set (derive from DB records for this year) ---
    let factorSetName = 'UBA 2024';
    let factorSource = 'Umweltbundesamt';
    let factorYear = year || 2024;
    try {
      const factor = await prisma.emissionFactor.findFirst({
        where: { validYear: year || 2024 },
        orderBy: { validYear: 'desc' },
        select: { source: true, validYear: true },
      });
      if (factor) {
        // source field contains a string like "UBA 2024" — use it as the factor set name
        factorSetName = factor.source;
        factorSource = 'Umweltbundesamt';
        factorYear = factor.validYear;
      }
    } catch {
      // keep defaults — emission factors are non-critical for methodology assembly
    }

    // --- Scopes covered: collect unique human-readable category labels ---
    const scope1Labels = new Set<string>();
    const scope2Labels = new Set<string>();
    const scope3Labels = new Set<string>();

    for (const e of entries) {
      const label = (CATEGORY_LABELS as Record<string, string>)[e.category] ?? e.category;
      if (e.scope === 'SCOPE1') scope1Labels.add(label);
      else if (e.scope === 'SCOPE2') scope2Labels.add(label);
      else scope3Labels.add(label);
    }
    // Material entries always contribute to Scope 3 (Category 1 purchased goods)
    for (const m of materials) {
      const label = (MATERIAL_LABELS as Record<string, string>)[m.material] ?? m.material;
      scope3Labels.add(label);
    }

    // --- Data quality: count entries by input method ---
    const allMethods = [
      ...entries.map((e: { inputMethod: string }) => e.inputMethod),
      ...materials.map((m: { inputMethod: string }) => m.inputMethod),
    ];
    const manualCount = allMethods.filter((m) => m === 'MANUAL').length;
    const ocrCount = allMethods.filter((m) => m === 'OCR').length;
    // CSV imports map to MethodologyDataQuality.estimated because they originate from
    // third-party exports and may not have been individually verified — consistent with
    // how the "estimated" field is described in the MethodologyDataQuality interface.
    const estimatedCount = allMethods.filter((m) => m === 'CSV').length;

    // --- Assumptions: prefer exclusions text, fall back to boundary notes ---
    const assumptions =
      profile?.exclusions?.trim() ||
      profile?.reportingBoundaryNotes?.trim() ||
      null;

    return {
      standard: 'GHG Protocol Corporate Standard',
      factorSet: {
        name: factorSetName,
        source: factorSource,
        year: factorYear,
      },
      scopesCovered: {
        scope1: Array.from(scope1Labels),
        scope2: Array.from(scope2Labels),
        scope3: Array.from(scope3Labels),
      },
      dataQuality: {
        manual: manualCount,
        ocrExtracted: ocrCount,
        estimated: estimatedCount,
        total: allMethods.length,
      },
      boundary: {
        companyName: profile?.firmenname ?? null,
        reportingYear: year,
        employees: profile?.mitarbeiter ?? null,
      },
      assumptions,
      engineVersion: ENGINE_VERSION,
    };
  } catch {
    // Return the fallback so a DB or logic error never prevents report generation
    return { ...FALLBACK_METHODOLOGY };
  }
}
