/**
 * PDF report generation API route for GrünBilanz.
 * Generates a GHG Protocol-compliant CO₂ footprint report as PDF.
 * Requires Node.js runtime for @react-pdf/renderer server-side rendering.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { ReportDocument } from '@/lib/pdf/ReportDocument';

export async function GET() {
  try {
    // Load company and latest reporting period
    const company = await prisma.company.findFirst({
      include: {
        reportingPeriods: {
          orderBy: { year: 'desc' },
          take: 1,
          include: { entries: true },
        },
      },
    });

    if (!company || company.reportingPeriods.length === 0) {
      return NextResponse.json({ error: 'Keine Daten gefunden' }, { status: 404 });
    }

    const period = company.reportingPeriods[0];
    const entries = period.entries.map((e) => ({
      scope: e.scope,
      category: e.category,
      subcategory: e.subcategory,
      co2e: Number(e.co2e),
      unit: e.unit,
    }));

    // Calculate scope totals
    const totalScope1 = entries
      .filter((e) => e.scope === 'SCOPE1')
      .reduce((s, e) => s + e.co2e, 0);
    const totalScope2 = entries
      .filter((e) => e.scope === 'SCOPE2')
      .reduce((s, e) => s + e.co2e, 0);
    const totalScope3 = entries
      .filter((e) => e.scope === 'SCOPE3')
      .reduce((s, e) => s + e.co2e, 0);

    const pdfBuffer = await renderToBuffer(
      React.createElement(ReportDocument as React.ElementType, {
        companyName: company.name,
        industry: company.industry,
        year: period.year,
        quarter: period.quarter,
        entries,
        totalScope1,
        totalScope2,
        totalScope3,
      })
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gruenbilanz-report-${period.year}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Fehler bei PDF-Generierung:', err);
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen' }, { status: 500 });
  }
}
