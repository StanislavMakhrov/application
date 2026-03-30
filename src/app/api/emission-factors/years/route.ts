/**
 * GET /api/emission-factors/years
 *
 * Returns distinct years that have factor data in the DB.
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
  // Fetch distinct validYear values from the DB
  const rawYears = await prisma.emissionFactor.findMany({
    select: { validYear: true },
    distinct: ['validYear'],
    orderBy: { validYear: 'asc' },
  });

  const dbYears = rawYears.map((r) => r.validYear);

  return NextResponse.json({ dbYears, ubaReferenceYears: [] });
}
