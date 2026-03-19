/**
 * PDF report API route — generates a GHG Protocol compliant PDF for a given year.
 * Uses @react-pdf/renderer for server-side rendering.
 *
 * GET /api/report/[year]
 * Returns: application/pdf
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCompany } from '@/services/companies';
import { getEnergyEntry } from '@/services/energy-entries';
import { GruenBilanzReport } from '@/components/report/Report';
import { createElement, type ReactElement } from 'react';

interface RouteParams {
  params: Promise<{ year: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) {
    return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const company = await getCompany(session.user.id);
  if (!company) {
    return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
  }

  const entry = await getEnergyEntry(company.id, year);
  if (!entry) {
    return NextResponse.json(
      { error: `Keine Energiedaten für ${year} gefunden` },
      { status: 404 },
    );
  }

  try {
    // Render PDF server-side using react-pdf
    // Type assertion needed: GruenBilanzReport returns Document (DocumentProps) internally
    const pdfBuffer = await renderToBuffer(
      createElement(GruenBilanzReport, { company, entry, year }) as ReactElement<DocumentProps>,
    );

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gruenbilanz-${company.name}-${year}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF-Generierung fehlgeschlagen:', error);
    return NextResponse.json(
      { error: 'PDF konnte nicht erstellt werden' },
      { status: 500 },
    );
  }
}
