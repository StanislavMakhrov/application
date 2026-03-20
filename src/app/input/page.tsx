/**
 * Input wizard entry page for GrünBilanz.
 * Renders the multi-step input wizard client component for entering emission data.
 */

export const dynamic = 'force-dynamic';

import InputWizard from '@/components/InputWizard';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function InputPage() {
  // Guard: if DATABASE_URL is not configured, show a friendly placeholder
  if (!process.env.DATABASE_URL) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/dashboard" className="hover:text-green-700 transition-colors">
            Dashboard
          </Link>
          <span>›</span>
          <span className="text-gray-700">Daten eingeben</span>
        </nav>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center py-12">
          <p className="text-gray-500 mb-2">Keine Datenbankverbindung konfiguriert.</p>
          <p className="text-sm text-gray-400">
            Starten Sie die Anwendung mit <code className="bg-gray-100 px-1 rounded">docker compose up</code>, um die Dateneingabe zu nutzen.
          </p>
        </div>
      </div>
    );
  }

  // Load available emission factors from DB for the current year
  const currentYear = new Date().getFullYear();
  const factors = await prisma.emissionFactor.findMany({
    where: { year: { in: [currentYear, currentYear - 1] } },
    orderBy: [{ year: 'desc' }, { category: 'asc' }],
  });

  // Load the company to get its ID for saving data
  const company = await prisma.company.findFirst();

  // Get or create reporting period for current year
  let period = company
    ? await prisma.reportingPeriod.findFirst({
        where: { companyId: company.id, year: currentYear, quarter: 'ANNUAL' },
      })
    : null;

  if (!period && company) {
    period = await prisma.reportingPeriod.create({
      data: { companyId: company.id, year: currentYear, quarter: 'ANNUAL' },
    });
  }

  // Load existing entries for the current period
  const existingEntries = period
    ? await prisma.emissionEntry.findMany({
        where: { reportingPeriodId: period.id },
      })
    : [];

  const serializedEntries = existingEntries.map((e) => ({
    ...e,
    quantity: Number(e.quantity),
    co2e: Number(e.co2e),
  }));

  const serializedFactors = factors.map((f) => ({
    ...f,
    factorKgCo2ePerUnit: Number(f.factorKgCo2ePerUnit),
    validFrom: f.validFrom.toISOString(),
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-green-700 transition-colors">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-gray-700">Daten eingeben</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Emissionsdaten eingeben</h1>
        <p className="text-sm text-gray-500 mb-6">
          Berichtsjahr {currentYear} · {company?.name ?? 'Unternehmen'}
        </p>

        {period ? (
          <InputWizard
            periodId={period.id}
            year={currentYear}
            factors={serializedFactors}
            existingEntries={serializedEntries}
          />
        ) : (
          <p className="text-red-500 text-sm">
            Kein Unternehmen gefunden. Bitte Datenbank initialisieren.
          </p>
        )}
      </div>
    </div>
  );
}
