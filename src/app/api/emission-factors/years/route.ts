/**
 * GET /api/emission-factors/years
 *
 * Returns distinct years that have factor data in the DB plus the years
 * for which built-in UBA reference data is available (for auto-fill eligibility).
 *
 * Response: { dbYears: number[], ubaReferenceYears: number[] }
 *
 * The UI uses ubaReferenceYears to enable/disable the "UBA-Werte übernehmen" button.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUbaReferenceYears } from '@/lib/uba-reference-data';

export async function GET() {
  // Fetch distinct validYear values from the DB
  const rawYears = await prisma.emissionFactor.findMany({
    select: { validYear: true },
    distinct: ['validYear'],
    orderBy: { validYear: 'asc' },
  });

  const dbYears = rawYears.map((r) => r.validYear);
  const ubaReferenceYears = getUbaReferenceYears();

  return NextResponse.json({ dbYears, ubaReferenceYears });
}
