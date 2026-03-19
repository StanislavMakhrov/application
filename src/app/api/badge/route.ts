/**
 * Sustainability badge PDF generation API route for GrünBilanz.
 * Generates a compact sustainability badge PDF suitable for websites and emails.
 * Requires Node.js runtime for @react-pdf/renderer server-side rendering.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { BadgeDocument } from '@/lib/pdf/BadgeDocument';

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
    const totalCo2eKg = period.entries.reduce((s, e) => s + Number(e.co2e), 0);

    const pdfBuffer = await renderToBuffer(
      React.createElement(BadgeDocument as React.ElementType, {
        companyName: company.name,
        year: period.year,
        totalCo2eKg,
        employeeCount: company.employeeCount,
        industry: company.industry,
      })
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gruenbilanz-badge-${period.year}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Fehler bei Badge-Generierung:', err);
    return NextResponse.json({ error: 'Badge-Generierung fehlgeschlagen' }, { status: 500 });
  }
}
