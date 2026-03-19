/**
 * CSRD questionnaire PDF generation API route for GrünBilanz.
 * Generates a pre-filled CSRD (EU Directive 2022/2464) questionnaire based on ESRS E1.
 * Requires Node.js runtime for @react-pdf/renderer server-side rendering.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { CsrdDocument } from '@/lib/pdf/CsrdDocument';

export async function GET() {
  try {
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
    const entries = period.entries;

    const totalScope1 = entries
      .filter((e) => e.scope === 'SCOPE1')
      .reduce((s, e) => s + Number(e.co2e), 0);
    const totalScope2 = entries
      .filter((e) => e.scope === 'SCOPE2')
      .reduce((s, e) => s + Number(e.co2e), 0);
    const totalScope3 = entries
      .filter((e) => e.scope === 'SCOPE3')
      .reduce((s, e) => s + Number(e.co2e), 0);

    const pdfBuffer = await renderToBuffer(
      React.createElement(CsrdDocument as React.ElementType, {
        companyName: company.name,
        industry: company.industry,
        location: company.location,
        employeeCount: company.employeeCount,
        year: period.year,
        totalScope1,
        totalScope2,
        totalScope3,
      })
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="csrd-fragebogen-${period.year}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Fehler bei CSRD-Generierung:', err);
    return NextResponse.json({ error: 'CSRD-Generierung fehlgeschlagen' }, { status: 500 });
  }
}
