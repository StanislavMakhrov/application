/**
 * PUT /api/emission-factors/[id]
 *
 * Updates a single emission factor's value (inline edit from the Settings table).
 * As a side effect, sets source to "Benutzerdefiniert {validYear}" to indicate
 * a manual override — this is reflected in the methodology block.
 *
 * Body: { factorKg: number }
 * Returns: the updated factor record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Ungültige Faktor-ID.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body.' }, { status: 400 });
  }

  // Validate factorKg: must be a finite number (positive, negative, or zero are all valid)
  const raw = (body as Record<string, unknown>)?.factorKg;
  if (raw === undefined || raw === null || typeof raw !== 'number' || !isFinite(raw)) {
    return NextResponse.json(
      { error: 'factorKg muss eine endliche Zahl sein.' },
      { status: 400 }
    );
  }
  const factorKg = raw;

  // Look up the existing record to determine its validYear for the source label
  const existing = await prisma.emissionFactor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Emissionsfaktor nicht gefunden.' }, { status: 404 });
  }

  // Mark as user-defined override so the methodology block reflects the change
  const updated = await prisma.emissionFactor.update({
    where: { id },
    data: {
      factorKg,
      source: `Benutzerdefiniert ${existing.validYear}`,
    },
  });

  return NextResponse.json(updated);
}
