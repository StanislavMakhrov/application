/**
 * PUT /api/factors/[id]  — update an emission factor record
 * DELETE /api/factors/[id] — delete an emission factor record
 *
 * Used by the EmissionFactorsTableEditable component in Settings.
 * Returns 404 when the record does not exist.
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

  const { factorKg, unit, source, validYear } = body as Record<string, unknown>;

  try {
    const updated = await prisma.emissionFactor.update({
      where: { id },
      data: {
        ...(factorKg !== undefined && { factorKg: Number(factorKg) }),
        ...(unit !== undefined && { unit: String(unit) }),
        ...(source !== undefined && { source: String(source) }),
        ...(validYear !== undefined && { validYear: Number(validYear) }),
      },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    // Prisma P2025 = record not found
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Emissionsfaktor nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Emissionsfaktor konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
  }

  try {
    await prisma.emissionFactor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Emissionsfaktor nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Emissionsfaktor konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }
}
