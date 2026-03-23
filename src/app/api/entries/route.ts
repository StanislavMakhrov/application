/**
 * GET /api/entries — returns emission entries or materials for a given year.
 * POST /api/entries — upserts a single emission entry.
 * DELETE /api/entries — deletes an emission entry by category.
 *
 * Query params:
 * - yearId: number — the reporting year ID
 * - scope: SCOPE1 | SCOPE2 | SCOPE3 — filter by scope (optional)
 * - type: "materials" | "profile" — return material entries or company profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveEntry, deleteEntry } from '@/lib/actions';
import type { Scope, EmissionCategory } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const yearId = searchParams.get('yearId');
  const scope = searchParams.get('scope') as Scope | null;
  const type = searchParams.get('type');

  // Return company profile
  if (type === 'profile') {
    const profile = await prisma.companyProfile.findUnique({ where: { id: 1 } });
    return NextResponse.json(profile ?? {});
  }

  if (!yearId) {
    return NextResponse.json({ error: 'yearId ist erforderlich' }, { status: 400 });
  }

  const yId = parseInt(yearId, 10);

  // Return material entries
  if (type === 'materials') {
    const materials = await prisma.materialEntry.findMany({
      where: { reportingYearId: yId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(materials);
  }

  // Return emission entries, optionally filtered by scope
  const entries = await prisma.emissionEntry.findMany({
    where: {
      reportingYearId: yId,
      ...(scope ? { scope } : {}),
    },
    orderBy: { category: 'asc' },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await saveEntry(body);
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const yearId = searchParams.get('yearId');
  const category = searchParams.get('category') as EmissionCategory | null;
  const scope = searchParams.get('scope') as Scope | null;

  if (!yearId || !category || !scope) {
    return NextResponse.json({ error: 'yearId, category und scope sind erforderlich' }, { status: 400 });
  }

  const result = await deleteEntry(parseInt(yearId, 10), scope, category);
  if (result.success) return NextResponse.json({ success: true });
  return NextResponse.json({ error: result.error }, { status: 400 });
}
