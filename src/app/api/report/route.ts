/**
 * POST /api/report — generates a PDF report for a given reporting year.
 *
 * Query params:
 * - yearId: number — the reporting year database ID
 * - type: "GHG_PROTOCOL" | "CSRD_QUESTIONNAIRE" (default: GHG_PROTOCOL)
 *
 * Returns the PDF file as a download.
 *
 * IMPORTANT: Must run on the Node.js runtime (not Edge) because
 * @react-pdf/renderer requires Node.js APIs.
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { getTotalCO2e } from '@/lib/emissions';
import { assembleMethodologyData } from '@/lib/methodology';
import { renderPdf } from '@/lib/pdf';
import { GHGReport } from '@/components/reports/GHGReport';
import { CSRDQuestionnaire } from '@/components/reports/CSRDQuestionnaire';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const yearIdStr = searchParams.get('yearId');
  const type = searchParams.get('type') ?? 'GHG_PROTOCOL';

  if (!yearIdStr) {
    return NextResponse.json({ error: 'yearId ist erforderlich' }, { status: 400 });
  }

  const yearId = parseInt(yearIdStr, 10);

  try {
    // Load year data
    const reportingYear = await prisma.reportingYear.findUnique({
      where: { id: yearId },
      include: {
        entries: true,
        materialEntries: true,
      },
    });

    if (!reportingYear) {
      return NextResponse.json({ error: 'Berichtsjahr nicht gefunden' }, { status: 404 });
    }

    // Load company profile and benchmark
    const profile = await prisma.companyProfile.findUnique({ where: { id: 1 } });
    if (!profile) {
      return NextResponse.json({ error: 'Firmenprofil nicht gefunden' }, { status: 404 });
    }

    const benchmark = await prisma.industryBenchmark.findUnique({
      where: { branche: profile.branche },
    });

    // Calculate totals
    const totals = await getTotalCO2e(yearId);

    // Render PDF based on type
    let pdfBuffer: Buffer;
    const filename = type === 'CSRD_QUESTIONNAIRE'
      ? `csrd-${reportingYear.year}.pdf`
      : `ghg-bericht-${reportingYear.year}.pdf`;

    if (type === 'CSRD_QUESTIONNAIRE') {
      const doc = React.createElement(CSRDQuestionnaire, {
        profile,
        year: reportingYear.year,
        totals,
      });
      pdfBuffer = await renderPdf(doc);
    } else {
      // Assemble methodology data for the GHG Protocol report only.
      // CSRD_QUESTIONNAIRE reports intentionally do not include methodology data.
      const methodology = await assembleMethodologyData(yearId, reportingYear.year, profile);

      const doc = React.createElement(GHGReport, {
        profile,
        year: reportingYear.year,
        totals,
        entries: reportingYear.entries.map((e: { category: string; quantity: number; isOekostrom: boolean; scope: string }) => ({
          category: e.category,
          quantity: e.quantity,
          isOekostrom: e.isOekostrom,
          scope: e.scope,
        })),
        materials: reportingYear.materialEntries,
        benchmarkValue: benchmark?.co2ePerEmployeePerYear,
        methodology,
      });
      pdfBuffer = await renderPdf(doc);
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'PDF-Bericht konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}

// Allow POST for backward compatibility
export { GET as POST };
