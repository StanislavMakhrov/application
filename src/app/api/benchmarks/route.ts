/**
 * GET /api/benchmarks         — list all industry benchmarks (optional ?year=YYYY filter)
 * POST /api/benchmarks        — create a new industry benchmark
 *
 * Used by the IndustryBenchmarkTableEditable component in Settings.
 * Returns valueKg mapped from the DB field co2ePerEmployeePerYear for DTO consistency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { IndustryBenchmarkRow } from '@/types';

/** Maps a DB record to the API DTO shape used by the editable table */
function toRow(record: { id: number; branche: string; co2ePerEmployeePerYear: number; validYear: number }): IndustryBenchmarkRow {
  return {
    id: String(record.id),
    branche: record.branche,
    valueKg: record.co2ePerEmployeePerYear,
    validYear: record.validYear,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const yearParam = req.nextUrl.searchParams.get('year');

  try {
    const where = yearParam && /^\d+$/.test(yearParam)
      ? { validYear: parseInt(yearParam, 10) }
      : {};

    const records = await prisma.industryBenchmark.findMany({
      where,
      orderBy: { branche: 'asc' },
    });

    return NextResponse.json(records.map(toRow), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Benchmarks konnten nicht geladen werden' },
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

  const { branche, valueKg, validYear } = body as Record<string, unknown>;

  if (!branche || valueKg === undefined || valueKg === null || !validYear) {
    return NextResponse.json(
      { error: 'branche, valueKg und validYear sind erforderlich' },
      { status: 400 }
    );
  }

  try {
    // Check for duplicate (branche, validYear)
    const existing = await prisma.industryBenchmark.findUnique({
      where: { branche_validYear: { branche: String(branche) as never, validYear: Number(validYear) } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Benchmark für diese Branche und Jahr bereits vorhanden' },
        { status: 409 }
      );
    }

    const created = await prisma.industryBenchmark.create({
      data: {
        branche: String(branche) as never,
        co2ePerEmployeePerYear: Number(valueKg),
        validYear: Number(validYear),
      },
    });

    return NextResponse.json(toRow(created), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Benchmark konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
