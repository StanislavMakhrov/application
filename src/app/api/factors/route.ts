/**
 * GET /api/factors?year=YYYY
 *
 * Returns all emission factor records for the given year, using the same
 * fallback chain as the CO₂e calculation engine. This endpoint is consumed
 * by the useFactors client hook, which feeds the FactorHint components in
 * every wizard screen.
 *
 * Cache-Control: no-store — factor values change when the DB seed is updated
 * without a new application deploy, so we must not cache stale values.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllEmissionFactorRecords } from '@/lib/factors';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const yearParam = req.nextUrl.searchParams.get('year');

  // Validate that year is a present, numeric integer string
  if (!yearParam || !/^\d+$/.test(yearParam)) {
    return NextResponse.json(
      { error: 'year ist erforderlich' },
      { status: 400 }
    );
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return NextResponse.json(
      { error: 'year ist erforderlich' },
      { status: 400 }
    );
  }

  try {
    const factors = await getAllEmissionFactorRecords(year);
    return NextResponse.json(factors, {
      headers: {
        // Prevent caching — DB seed updates must propagate immediately
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Faktoren konnten nicht geladen werden' },
      { status: 500 }
    );
  }
}
