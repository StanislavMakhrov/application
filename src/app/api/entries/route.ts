/**
 * Emission entries API route for GrünBilanz.
 * Handles saving/updating emission entries for a reporting period.
 * Replaces all entries for a given scope in the period (upsert semantics).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema for emission entries
const EntrySchema = z.object({
  reportingPeriodId: z.number().int().positive(),
  scope: z.enum(['SCOPE1', 'SCOPE2', 'SCOPE3']),
  category: z.string().min(1),
  subcategory: z.string().nullable(),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  co2e: z.number().nonnegative(),
  sourceType: z.enum(['MANUAL', 'OCR']).default('MANUAL'),
});

const RequestSchema = z.object({
  entries: z.array(EntrySchema),
  scope: z.enum(['SCOPE1', 'SCOPE2', 'SCOPE3']),
  periodId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, scope, periodId } = RequestSchema.parse(body);

    // Verify the reporting period exists
    const period = await prisma.reportingPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return NextResponse.json({ error: 'Berichtszeitraum nicht gefunden' }, { status: 404 });
    }

    // Delete existing entries for this scope and period, then insert new ones
    // This implements replace semantics: submitting the form overwrites previous data
    await prisma.$transaction([
      prisma.emissionEntry.deleteMany({
        where: { reportingPeriodId: periodId, scope },
      }),
      ...(entries.length > 0
        ? [
            prisma.emissionEntry.createMany({
              data: entries.map((e) => ({
                reportingPeriodId: e.reportingPeriodId,
                scope: e.scope,
                category: e.category,
                subcategory: e.subcategory,
                quantity: e.quantity,
                unit: e.unit,
                co2e: e.co2e,
                sourceType: e.sourceType,
              })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, count: entries.length });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Daten', details: e.errors }, { status: 400 });
    }
    console.error('Fehler beim Speichern:', e);
    return NextResponse.json({ error: 'Speicherfehler' }, { status: 500 });
  }
}
