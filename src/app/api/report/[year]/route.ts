/**
 * PDF Report API route — generates and returns a CO₂ report as a PDF.
 *
 * Route: GET /api/report/[year]
 *
 * Auth: requires an authenticated Supabase session (via cookie).
 * Unauthenticated requests receive a 401 response.
 *
 * Performance target: < 3 seconds (per quality goal QG-2 in architecture.md).
 * React-PDF renders synchronously on the server — no browser needed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getCompanyByUserId } from '@/services/companies';
import { getEnergyEntryByYear } from '@/services/energy-entries';
import ReportDocument from '@/components/report/ReportDocument';

interface RouteParams {
  params: Promise<{ year: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return new NextResponse('Ungültiges Jahr', { status: 400 });
  }

  // Authenticate the request — no session = 401
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Nicht angemeldet', { status: 401 });
  }

  // Tenant isolation: fetch company by authenticated user's ID only
  const company = await getCompanyByUserId(user.id);
  if (!company) {
    return new NextResponse('Unternehmensprofil nicht gefunden', { status: 404 });
  }

  const entry = await getEnergyEntryByYear(company.id, year);
  if (!entry) {
    return new NextResponse(`Keine Daten für das Jahr ${year}`, { status: 404 });
  }

  // renderToBuffer returns a Node.js Buffer; NextResponse needs a BodyInit-compatible type.
  // Wrapping in Uint8Array satisfies both TypeScript and the runtime requirement.
  const pdfBuffer = await renderToBuffer(
    ReportDocument({
      company: {
        name: company.name,
        branche: company.branche,
        mitarbeiter: company.mitarbeiter,
        standort: company.standort,
      },
      entry: {
        year: entry.year,
        stromKwh: entry.stromKwh,
        erdgasM3: entry.erdgasM3,
        dieselL: entry.dieselL,
        heizoeL: entry.heizoeL,
        co2Scope1T: entry.co2Scope1T,
        co2Scope2T: entry.co2Scope2T,
        co2TotalT: entry.co2TotalT,
      },
      generatedAt: new Date(),
    }),
  );

  const filename = `gruenbilanz-co2-bericht-${company.name.replace(/[^a-z0-9]/gi, '-')}-${year}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Prevent caching so freshly generated reports are always returned
      'Cache-Control': 'no-store',
    },
  });
}
