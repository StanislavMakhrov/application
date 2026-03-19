import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { getCompanyByUserId } from '@/services/companies';
import { getEnergyEntryByYear } from '@/services/energy-entries';
import { getBenchmark } from '@/lib/benchmarks';
import type { Company, EnergyEntry } from '@/types';

/** GET /api/report/[year] — generate and stream a PDF report */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);

  if (isNaN(year)) {
    return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });
  }

  let company: Company;
  let entry: EnergyEntry;

  if (isDemoMode) {
    company = {
      id: 'demo', user_id: 'demo', name: 'Musterbetrieb GmbH',
      branche: 'Elektrotechnik', mitarbeiter: 5, standort: 'Berlin',
    };
    entry = {
      id: 'demo', company_id: 'demo', year,
      strom_kwh: 25000, erdgas_m3: 3000, diesel_l: 1500, heizoel_l: 0,
      co2_scope1_t: 9.975, co2_scope2_t: 9.5, co2_total_t: 19.475,
    };
  } else {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Datenbankverbindung nicht verfügbar' }, { status: 503 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const comp = await getCompanyByUserId(supabase, session.user.id);
    if (!comp) {
      return NextResponse.json({ error: 'Unternehmensprofil nicht gefunden' }, { status: 404 });
    }

    const e = await getEnergyEntryByYear(supabase, comp.id, year);
    if (!e) {
      return NextResponse.json({ error: `Keine Daten für ${year} gefunden` }, { status: 404 });
    }

    company = comp;
    entry = e;
  }

  const benchmark = getBenchmark(company.branche);

  // Dynamic import to avoid bundling @react-pdf/renderer client-side
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const { createReportElement } = await import('@/components/report/ReportDocument');

  const pdfBuffer = await renderToBuffer(
    createReportElement({ company, entry, benchmark, year })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="GruenBilanz_${company.name}_${year}.pdf"`,
    },
  });
}
