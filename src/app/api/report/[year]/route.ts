/**
 * PDF report generation API route.
 *
 * Renders a GrünBilanz CO₂ report PDF using React-PDF and returns it as an
 * inline attachment. Must be accessed while authenticated; unauthenticated
 * requests receive a 401 response.
 *
 * Performance target: < 3 seconds under normal load (see architecture.md §1.2).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCompany } from '@/services/companies';
import { getEnergyEntry } from '@/services/energy-entries';
import { getBenchmark } from '@/lib/benchmarks';
import type { Branche } from '@/lib/benchmarks';
import ReportDocument from '@/components/report/ReportDocument';

interface RouteParams {
  params: Promise<{ year: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);

  if (isNaN(year)) {
    return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });
  }

  // Authenticate the request — PDF must only be accessible by the data owner
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const company = await getCompany();
  if (!company) {
    return NextResponse.json({ error: 'Betrieb nicht gefunden' }, { status: 404 });
  }

  const entry = await getEnergyEntry(company.id, year);
  if (!entry) {
    return NextResponse.json({ error: 'Keine Daten für dieses Jahr' }, { status: 404 });
  }

  const benchmark = getBenchmark(company.branche as Branche, year);

  // Render the React-PDF document to a binary buffer server-side.
  // The cast is required because TypeScript cannot verify that our wrapper
  // component returns a Document element at the type level.
  const buffer = await renderToBuffer(
    React.createElement(ReportDocument, {
      companyName: company.name,
      branche: company.branche,
      mitarbeiter: company.mitarbeiter,
      standort: company.standort,
      year,
      strom_kwh: entry.strom_kwh,
      erdgas_m3: entry.erdgas_m3,
      diesel_l: entry.diesel_l,
      heizoel_l: entry.heizoel_l,
      scope1_t: entry.co2_scope1_t,
      scope2_t: entry.co2_scope2_t,
      total_t: entry.co2_total_t,
      benchmark,
    }) as React.ReactElement<DocumentProps>,
  );

  const filename = `GruenBilanz_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${year}.pdf`;

  // Convert Buffer to Uint8Array for NextResponse compatibility
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      // Prevent caching of personal financial/environmental data
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
