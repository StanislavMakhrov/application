/**
 * GET /api/emission-factors/years
 *
 * Returns all years that should appear in the Emissionsfaktoren year selector:
 * the union of years from ReportingYear (all configured reporting years) and
 * years that already have emission factor records in the DB.
 *
 * This ensures a newly added Berichtsjahr (reporting year with no factors yet)
 * still appears in the selector so factors can be entered for it.
 *
 * Response: { dbYears: number[], ubaReferenceYears: number[] }
 *
 * ubaReferenceYears is always an empty array — UBA reference data is not
 * bundled in source code. UBA values are managed exclusively in the database.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Fetch all configured reporting years
  const reportingYears = await prisma.reportingYear.findMany({
    select: { year: true },
    orderBy: { year: 'asc' },
  });

  // Fetch distinct validYear values from emission factor records
  const factorYears = await prisma.emissionFactor.findMany({
    select: { validYear: true },
    distinct: ['validYear'],
    orderBy: { validYear: 'asc' },
  });

  // Union of both sources, deduplicated and sorted ascending
  const yearSet = new Set<number>([
    ...reportingYears.map((r) => r.year),
    ...factorYears.map((f) => f.validYear),
  ]);
  const dbYears = Array.from(yearSet).sort((a, b) => a - b);

  return NextResponse.json({ dbYears, ubaReferenceYears: [] });
}
