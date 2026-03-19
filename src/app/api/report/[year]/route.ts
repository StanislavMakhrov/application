import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getCompanyByUserId } from '@/services/companies';
import { getEnergyEntryByYear } from '@/services/energy-entries';
import { getBenchmark } from '@/lib/benchmarks';

/** GET /api/report/[year] — generate and return a PDF CO₂ report */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);
  if (isNaN(year)) return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  const company = await getCompanyByUserId(user.id);
  if (!company) {
    return NextResponse.json({ error: 'Unternehmensprofil nicht gefunden' }, { status: 404 });
  }

  const entry = await getEnergyEntryByYear(company.id, year);
  if (!entry) {
    return NextResponse.json({ error: `Keine Daten für ${year} gefunden` }, { status: 404 });
  }

  const benchmark = getBenchmark(company.branche);

  // Dynamic imports keep @react-pdf/renderer out of the client bundle
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
