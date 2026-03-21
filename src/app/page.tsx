/**
 * Dashboard — main landing page of GrünBilanz.
 *
 * This is a React Server Component that loads all data at request time
 * via Prisma. No authentication — the app opens directly to this page.
 *
 * Displays:
 * - Company name and year selector
 * - Key CO₂e KPIs (total, per employee, vs benchmark)
 * - Scope 1/2/3 donut chart
 * - Per-category bar chart
 * - Year-over-year comparison (2023 vs 2024)
 * - Industry benchmark comparison
 * - Per-category completion checklist
 * - "Daten erfassen" → /wizard/1
 * - "Bericht erstellen" → /api/report
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getTotalCO2e } from '@/lib/emissions';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ScopeDonut } from '@/components/dashboard/ScopeDonut';
import { CategoryBarChart } from '@/components/dashboard/CategoryBarChart';
import { YearOverYearChart } from '@/components/dashboard/YearOverYearChart';
import { BranchenvergleichCard } from '@/components/dashboard/BranchenvergleichCard';
import { CategoryStatusList } from '@/components/dashboard/CategoryStatusList';
import { YearSelector } from '@/components/dashboard/YearSelector';
import { BRANCHE_LABELS } from '@/types';
import type { CO2eTotals } from '@/types';
import type { Branche } from '@/types';

// Revalidate data on every request so the dashboard is always fresh
export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: { year?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Load all available reporting years
  const allYears = await prisma.reportingYear.findMany({
    orderBy: { year: 'asc' },
  });

  // Determine selected year from URL param or use the latest
  const years = allYears.map((y) => y.year);
  const selectedYear = searchParams.year
    ? parseInt(searchParams.year, 10)
    : years[years.length - 1] ?? new Date().getFullYear();

  // Load data for the selected year
  const currentYearRecord = await prisma.reportingYear.findUnique({
    where: { year: selectedYear },
    include: { entries: true, materialEntries: true },
  });

  const companyProfile = await prisma.companyProfile.findUnique({ where: { id: 1 } });
  const benchmark = companyProfile
    ? await prisma.industryBenchmark.findUnique({ where: { branche: companyProfile.branche } })
    : null;

  // Calculate totals for selected year
  const emptyTotals: CO2eTotals = { scope1: 0, scope2: 0, scope3: 0, total: 0, byCategory: {} };
  const currentTotals = currentYearRecord
    ? await getTotalCO2e(currentYearRecord.id)
    : emptyTotals;

  // Calculate totals for the previous year (for YoY comparison)
  const prevYear = selectedYear - 1;
  const prevYearRecord = await prisma.reportingYear.findUnique({ where: { year: prevYear } });
  const prevTotals = prevYearRecord ? await getTotalCO2e(prevYearRecord.id) : emptyTotals;

  // Per-employee metrics
  const mitarbeiter = companyProfile?.mitarbeiter ?? 1;
  const co2ePerEmployee = mitarbeiter > 0 ? currentTotals.total / mitarbeiter : 0;
  const benchmarkPerEmployee = benchmark?.co2ePerEmployeePerYear ?? 12.5;

  // Categories that have been captured (quantity > 0)
  const capturedCategories = new Set<string>(
    (currentYearRecord?.entries ?? [])
      .filter((e) => e.quantity > 0)
      .map((e) => e.category)
  );
  // Add materials too
  for (const mat of currentYearRecord?.materialEntries ?? []) {
    if (mat.quantityKg > 0) capturedCategories.add(mat.material);
  }

  const reportUrl = currentYearRecord
    ? `/api/report?yearId=${currentYearRecord.id}&type=GHG_PROTOCOL`
    : '#';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-brand-green">
              🌿 GrünBilanz
            </h1>
            <p className="text-sm text-gray-500">
              {companyProfile?.firmenname ?? 'Unbekanntes Unternehmen'} ·{' '}
              {companyProfile?.standort ?? ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {years.length > 0 && (
              <YearSelector years={years} selectedYear={selectedYear} />
            )}
            <Link
              href="/wizard/1"
              className="inline-flex items-center justify-center rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green/90 min-h-[44px] transition-colors"
            >
              Daten erfassen
            </Link>
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium min-h-[44px] transition-colors border ${
                currentYearRecord
                  ? 'border-brand-green text-brand-green hover:bg-brand-green-pale'
                  : 'border-gray-300 text-gray-400 pointer-events-none'
              }`}
            >
              Bericht erstellen
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Gesamt CO₂e"
            value={currentTotals.total.toFixed(1)}
            unit="t"
            subtitle={`Berichtsjahr ${selectedYear}`}
            highlight
          />
          <KpiCard
            title="pro Mitarbeiter"
            value={co2ePerEmployee.toFixed(1)}
            unit="t/MA"
            subtitle={`${mitarbeiter} Mitarbeitende`}
          />
          <KpiCard
            title="Scope 1 (direkt)"
            value={currentTotals.scope1.toFixed(1)}
            unit="t"
            subtitle="Eigene Verbrennung"
          />
          <KpiCard
            title="Scope 2 (Energie)"
            value={currentTotals.scope2.toFixed(1)}
            unit="t"
            subtitle="Strom & Fernwärme"
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Scope Donut */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Scope-Verteilung</h2>
            <ScopeDonut
              scope1={currentTotals.scope1}
              scope2={currentTotals.scope2}
              scope3={currentTotals.scope3}
            />
          </div>

          {/* Category bar chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-5 overflow-x-auto">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Emissionen nach Kategorie (t CO₂e)
            </h2>
            <CategoryBarChart byCategory={currentTotals.byCategory} />
          </div>
        </div>

        {/* YoY comparison + Benchmark + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Year-over-year */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Jahresvergleich {prevYear} vs. {selectedYear}
            </h2>
            <YearOverYearChart
              year1={prevYear}
              totals1={prevTotals}
              year2={selectedYear}
              totals2={currentTotals}
            />
          </div>

          {/* Benchmark + Status */}
          <div className="space-y-4">
            <BranchenvergleichCard
              companyValue={co2ePerEmployee}
              benchmarkValue={benchmarkPerEmployee}
              brancheLabel={
                companyProfile
                  ? BRANCHE_LABELS[companyProfile.branche as Branche]
                  : 'Handwerk'
              }
              mitarbeiter={mitarbeiter}
            />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Erfassungsstatus {selectedYear}
              </h2>
              <CategoryStatusList capturedCategories={capturedCategories} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
