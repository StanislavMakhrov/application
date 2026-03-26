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
 *
 * POST /api/factors
 *
 * Creates a new emission factor record.
 * Body: { key, factorKg, unit, source, validYear }
 * Returns 201 on success, 400 on missing fields, 409 on duplicate (key, validYear).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllEmissionFactorRecords } from '@/lib/factors';
import { prisma } from '@/lib/prisma';

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const { key, factorKg, unit, source, validYear } = body as Record<string, unknown>;

  // Validate required fields
  if (!key || factorKg === undefined || factorKg === null || !unit || !source || !validYear) {
    return NextResponse.json(
      { error: 'key, factorKg, unit, source und validYear sind erforderlich' },
      { status: 400 }
    );
  }

  try {
    // Check for duplicate (key, validYear) — return 409 if exists
    const existing = await prisma.emissionFactor.findUnique({
      where: { key_validYear: { key: String(key), validYear: Number(validYear) } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Emissionsfaktor für diesen Schlüssel und Jahr bereits vorhanden' },
        { status: 409 }
      );
    }

    // scope defaults to SCOPE1 when creating via API (can be extended later)
    const created = await prisma.emissionFactor.create({
      data: {
        key: String(key),
        factorKg: Number(factorKg),
        unit: String(unit),
        source: String(source),
        validYear: Number(validYear),
        scope: 'SCOPE1',
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Emissionsfaktor konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
