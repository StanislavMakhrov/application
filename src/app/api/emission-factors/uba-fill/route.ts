/**
 * POST /api/emission-factors/uba-fill
 *
 * Auto-fills (full replace) all emission factors for a given year with the
 * official UBA reference values bundled in src/lib/uba-reference-data.ts.
 *
 * This is a full replace, not a merge — existing custom overrides are
 * overwritten. Users are warned via a confirmation dialog in the UI before
 * this endpoint is called.
 *
 * Body: { year: number }
 * Returns: { upsertedCount: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UBA_REFERENCE_DATA, getUbaReferenceYears } from '@/lib/uba-reference-data';
import { Scope } from '@prisma/client';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body.' }, { status: 400 });
  }

  const yearRaw = (body as Record<string, unknown>)?.year;
  if (yearRaw === undefined || yearRaw === null || typeof yearRaw !== 'number' || !isFinite(yearRaw)) {
    return NextResponse.json(
      { error: 'year muss eine gültige Jahreszahl sein.' },
      { status: 400 }
    );
  }

  const year = Math.trunc(yearRaw);
  const availableYears = getUbaReferenceYears();

  if (!availableYears.includes(year)) {
    return NextResponse.json(
      {
        error: `Keine offiziellen UBA-Werte für ${year} verfügbar. Verfügbare Jahre: ${availableYears.join(', ')}.`,
      },
      { status: 400 }
    );
  }

  const factors = UBA_REFERENCE_DATA[year];
  let upsertedCount = 0;

  for (const factor of factors) {
    await prisma.emissionFactor.upsert({
      where: { key_validYear: { key: factor.key, validYear: year } },
      update: {
        factorKg: factor.factorKg,
        unit: factor.unit,
        source: factor.source,
        label: factor.label,
        scope: factor.scope as Scope,
      },
      create: {
        key: factor.key,
        validYear: year,
        factorKg: factor.factorKg,
        unit: factor.unit,
        source: factor.source,
        label: factor.label,
        scope: factor.scope as Scope,
      },
    });
    upsertedCount += 1;
  }

  return NextResponse.json({ upsertedCount });
}
