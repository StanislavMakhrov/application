/**
 * PUT /api/benchmarks/[id] — update an industry benchmark record.
 *
 * Accepts { valueKg, validYear } in the request body.
 * Returns 404 if the record does not exist.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const { valueKg, validYear } = body as Record<string, unknown>;

  try {
    const updated = await prisma.industryBenchmark.update({
      where: { id },
      data: {
        ...(valueKg !== undefined && { co2ePerEmployeePerYear: Number(valueKg) }),
        ...(validYear !== undefined && { validYear: Number(validYear) }),
      },
    });

    return NextResponse.json({
      id: String(updated.id),
      branche: updated.branche,
      valueKg: updated.co2ePerEmployeePerYear,
      validYear: updated.validYear,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Benchmark nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Benchmark konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}
