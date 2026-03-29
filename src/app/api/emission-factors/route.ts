/**
 * GET /api/emission-factors?year={year}
 *
 * Returns all EmissionFactor records for a given calendar year,
 * sorted by scope then key. Used by the Settings UI factor table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FACTOR_LABELS } from '@/lib/factor-labels';

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get('year');

  if (!yearParam) {
    return NextResponse.json(
      { error: 'Der Parameter "year" ist erforderlich.' },
      { status: 400 }
    );
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return NextResponse.json(
      { error: 'Der Parameter "year" muss eine gültige Jahreszahl sein.' },
      { status: 400 }
    );
  }

  const factors = await prisma.emissionFactor.findMany({
    where: { validYear: year },
    orderBy: [{ scope: 'asc' }, { key: 'asc' }],
  });

  // Resolve display label: DB field → static fallback → raw key
  const result = factors.map((f) => ({
    id: f.id,
    key: f.key,
    label: f.label ?? FACTOR_LABELS[f.key] ?? f.key,
    factorKg: f.factorKg,
    unit: f.unit,
    scope: f.scope,
    source: f.source,
    validYear: f.validYear,
  }));

  return NextResponse.json(result);
}
