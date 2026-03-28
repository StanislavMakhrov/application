/**
 * Dashboard — main landing page of GrünBilanz.
 *
 * This is a React Server Component that loads all data at request time
 * via Prisma. No authentication — the app opens directly to this page.
 */

import Link from 'next/link';
import { Leaf, TrendingDown, Users, Zap, BarChart3, Settings } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getTotalCO2e } from '@/lib/emissions';
import { assembleMethodology } from '@/lib/methodology';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ScopeDonut } from '@/components/dashboard/ScopeDonut';
import { CategoryBarChart } from '@/components/dashboard/CategoryBarChart';
import { YearOverYearChart } from '@/components/dashboard/YearOverYearChart';
import { BranchenvergleichCard } from '@/components/dashboard/BranchenvergleichCard';
import { CategoryStatusList } from '@/components/dashboard/CategoryStatusList';
import { YearSelector } from '@/components/dashboard/YearSelector';
import { MethodologySection } from '@/components/dashboard/MethodologySection';
import { BRANCHE_LABELS } from '@/types';
import type { CO2eTotals } from '@/types';
import type { Branche } from '@/types';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: { year?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const allYears = await prisma.reportingYear.findMany({ orderBy: { year: 'asc' } });
  const years = allYears.map((y: { year: number }) => y.year);
  const selectedYear = searchParams.year
    ? parseInt(searchParams.year, 10)
    : years[years.length - 1] ?? new Date().getFullYear();
  const nextYear = years.length > 0 ? years[years.length - 1] + 1 : new Date().getFullYear();

  const currentYearRecord = await prisma.reportingYear.findUnique({
    where: { year: selectedYear },
    include: { entries: true, materialEntries: true },
  });

  const companyProfile = await prisma.companyProfile.findUnique({ where: { id: 1 } });
  const benchmark = companyProfile
    ? await prisma.industryBenchmark.findUnique({ where: { branche: companyProfile.branche } })
    : null;

  const emptyTotals: CO2eTotals = { scope1: 0, scope2: 0, scope3: 0, total: 0, byCategory: {} };
  const currentTotals = currentYearRecord ? await getTotalCO2e(currentYearRecord.id) : emptyTotals;

  // Assemble methodology for the selected year — returns null on any error so the
  // dashboard still renders if methodology assembly fails.
  const methodology = currentYearRecord
    ? await assembleMethodology(currentYearRecord.id).catch(() => null)
    : null;

  const prevYear = selectedYear - 1;
  const prevYearRecord = await prisma.reportingYear.findUnique({ where: { year: prevYear } });
  const prevTotals = prevYearRecord ? await getTotalCO2e(prevYearRecord.id) : emptyTotals;

  const mitarbeiter = companyProfile?.mitarbeiter ?? 1;
  const co2ePerEmployee = mitarbeiter > 0 ? currentTotals.total / mitarbeiter : 0;
  const benchmarkPerEmployee = benchmark?.co2ePerEmployeePerYear ?? 12.5;

  const capturedCategories = new Set<string>(
    (currentYearRecord?.entries ?? []).filter((e: { quantity: number }) => e.quantity > 0).map((e: { category: string }) => e.category)
  );
  for (const mat of currentYearRecord?.materialEntries ?? []) {
    if (mat.quantityKg > 0) capturedCategories.add(mat.material);
  }

  const reportUrl = currentYearRecord
    ? `/api/report?yearId=${currentYearRecord.id}&type=GHG_PROTOCOL`
    : '#';

  const prevTotal = prevTotals.total;
  const yoyTrend = prevTotal > 0
    ? { value: ((currentTotals.total - prevTotal) / prevTotal) * 100, label: 'ggü. Vorjahr' }
    : undefined;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-brand-green/20 bg-white/80 backdrop-blur-sm px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-brand-green-light shadow-sm">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-brand-green leading-tight">GrünBilanz</h1>
              <p className="text-xs text-gray-400 leading-tight">
                {companyProfile?.firmenname ?? 'Unbekanntes Unternehmen'}
                {companyProfile?.standort ? ` · ${companyProfile.standort}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <YearSelector years={years} selectedYear={selectedYear} nextYear={nextYear} />
            <Link
              href="/wizard/1"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark min-h-[38px] shadow-sm transition-colors"
            >
              Daten erfassen
            </Link>
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold min-h-[38px] transition-colors border ${
                currentYearRecord
                  ? 'border-brand-green text-brand-green hover:bg-brand-green-pale'
                  : 'border-gray-200 text-gray-300 pointer-events-none'
              }`}
            >
              Bericht erstellen
            </a>
            <Link
              href="/settings"
              title="Einstellungen"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 min-h-[38px] w-[38px] transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page title row */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">CO₂-Bilanz {selectedYear}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Treibhausgasemissionen nach GHG Protocol · Scope 1, 2, 3
          </p>
        </div>

        {/* Collapsible methodology block — auto-generated from reporting year data */}
        {methodology && <MethodologySection methodology={methodology} />}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Gesamt CO₂e"
            value={currentTotals.total.toFixed(1)}
            unit="t"
            subtitle={`Berichtsjahr ${selectedYear}`}
            highlight
            icon={BarChart3}
            trend={yoyTrend}
          />
          <KpiCard
            title="pro Mitarbeiter"
            value={co2ePerEmployee.toFixed(1)}
            unit="t/MA"
            subtitle={`${mitarbeiter} Mitarbeitende`}
            icon={Users}
          />
          <KpiCard
            title="Scope 1 (direkt)"
            value={currentTotals.scope1.toFixed(1)}
            unit="t"
            subtitle="Eigene Verbrennung"
            icon={TrendingDown}
          />
          <KpiCard
            title="Scope 2 (Energie)"
            value={currentTotals.scope2.toFixed(1)}
            unit="t"
            subtitle="Strom & Fernwärme"
            icon={Zap}
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Scope Donut */}
          <div className="bg-white rounded-card border border-card-border shadow-card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Scope-Verteilung</h2>
            <p className="text-xs text-gray-400 mb-3">Anteil pro Emissionsklasse</p>
            <ScopeDonut
              scope1={currentTotals.scope1}
              scope2={currentTotals.scope2}
              scope3={currentTotals.scope3}
            />
          </div>

          {/* Category bar chart */}
          <div className="lg:col-span-2 bg-white rounded-card border border-card-border shadow-card p-5 overflow-x-auto">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Emissionen nach Kategorie</h2>
            <p className="text-xs text-gray-400 mb-3">In Tonnen CO₂e · sortiert nach Größe</p>
            <CategoryBarChart byCategory={currentTotals.byCategory} />
          </div>
        </div>

        {/* YoY comparison + Benchmark + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Year-over-year */}
          <div className="lg:col-span-2 bg-white rounded-card border border-card-border shadow-card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              Jahresvergleich {prevYear} vs. {selectedYear}
            </h2>
            <p className="text-xs text-gray-400 mb-3">Scope 1/2/3 gestapelt · t CO₂e</p>
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
                companyProfile ? BRANCHE_LABELS[companyProfile.branche as Branche] : 'Handwerk'
              }
              mitarbeiter={mitarbeiter}
            />
            <div className="bg-white rounded-card border border-card-border shadow-card p-5">
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
