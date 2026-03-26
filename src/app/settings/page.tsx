/**
 * Settings page — manage company profile and reporting years.
 */

import Link from 'next/link';
import { Leaf, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getAllEmissionFactorRecords } from '@/lib/factors';
import { YearManagement } from '@/components/settings/YearManagement';
import { FirmenprofilSettings } from '@/components/settings/FirmenprofilSettings';
import { EmissionFactorsTable } from '@/components/settings/EmissionFactorsTable';
import { IndustryBenchmarkTable } from '@/components/settings/IndustryBenchmarkTable';
import type { Branche } from '@/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const allYears = await prisma.reportingYear.findMany({ orderBy: { year: 'asc' } });
  const years = allYears.map((y: { year: number }) => y.year);
  const nextYear = years.length > 0 ? years[years.length - 1] + 1 : new Date().getFullYear();

  // Derive the most recent reporting year for factor display; fall back to current calendar year
  const currentYear = years.length > 0 ? years[years.length - 1] : new Date().getFullYear();

  // Fetch factor records and benchmarks server-side (direct lib call — no HTTP needed)
  const factorRecords = await getAllEmissionFactorRecords(currentYear);
  const benchmarks = await prisma.industryBenchmark.findMany({
    orderBy: { branche: 'asc' },
  }) as Array<{ branche: Branche; co2ePerEmployeePerYear: number }>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-brand-green/20 bg-white/80 backdrop-blur-sm px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-brand-green-light shadow-sm">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-brand-green">GrünBilanz</span>
            </Link>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
          <p className="text-sm text-gray-500 mt-1">App-Konfiguration und Datenverwaltung</p>
        </div>

        {/* Company profile — placed first as it is the most prominent identity setting */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Firmenprofil</h2>
          <p className="text-sm text-gray-500 mb-5">
            Stammdaten Ihres Unternehmens — erscheinen auf dem PDF-Bericht und im Dashboard.
          </p>
          <FirmenprofilSettings />
        </section>

        {/* Year management */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Berichtsjahre</h2>
          <p className="text-sm text-gray-500 mb-5">
            Berichtsjahre hinzufügen oder löschen. Das Löschen eines Jahres entfernt dauerhaft
            alle zugehörigen Emissionsdaten.
          </p>
          <YearManagement years={years} nextYear={nextYear} />
        </section>

        {/* Emission factors reference table — read-only, shows all DB factor values */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Emissionsfaktoren</h2>
          <p className="text-sm text-gray-500 mb-5">
            Aktive UBA-Emissionsfaktoren für das Berichtsjahr {currentYear}. Diese Werte werden
            für alle CO₂e-Berechnungen verwendet.
          </p>
          <EmissionFactorsTable factors={factorRecords} year={currentYear} />
        </section>

        {/* Industry benchmarks reference table — read-only */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Branchenvergleich (Benchmarks)
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Durchschnittliche CO₂e-Emissionen pro Mitarbeiter und Jahr nach Branche (Referenzwerte).
          </p>
          <IndustryBenchmarkTable benchmarks={benchmarks} />
        </section>
      </div>
    </div>
  );
}
