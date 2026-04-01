/**
 * GET /api/methodology?yearId={yearId}
 *
 * Returns the assembled MethodologyData for a given reporting year.
 * Used by the dashboard's MethodologySummary client component so users can
 * review the methodology without downloading the PDF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMethodologyData } from '@/lib/methodology';

export async function GET(req: NextRequest) {
  const yearIdParam = req.nextUrl.searchParams.get('yearId');

  if (!yearIdParam) {
    return NextResponse.json(
      { error: 'Der Parameter "yearId" ist erforderlich.' },
      { status: 400 }
    );
  }

  const yearId = parseInt(yearIdParam, 10);
  if (isNaN(yearId)) {
    return NextResponse.json(
      { error: 'Der Parameter "yearId" muss eine gültige Zahl sein.' },
      { status: 400 }
    );
  }

  // Verify the year exists before assembling methodology
  const yearExists = await prisma.reportingYear.findUnique({ where: { id: yearId } });
  if (!yearExists) {
    return NextResponse.json({ error: 'Berichtsjahr nicht gefunden.' }, { status: 404 });
  }

  const data = await getMethodologyData(yearId);
  return NextResponse.json(data);
}
