/**
 * Dashboard page — main view for GrünBilanz.
 * Server component that loads emission data and renders the CO₂ overview.
 * Shows scope breakdown, year-over-year comparison, and industry benchmarks.
 */

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import DashboardCharts from '@/components/DashboardCharts';
import Link from 'next/link';

/** Group and sum emission entries by scope */
function sumByScope(entries: { scope: string; co2e: number }[]) {
  const result = { SCOPE1: 0, SCOPE2: 0, SCOPE3: 0 };
  for (const entry of entries) {
    if (entry.scope in result) {
      result[entry.scope as keyof typeof result] += entry.co2e;
    }
  }
  return result;
}

/** Convert Decimal (from Prisma) to plain number */
function toNum(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof (val as { toNumber: () => number }).toNumber === 'function') {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

export default async function DashboardPage() {
  // Load the first company (Musterbetrieb GmbH in production, first available in dev)
  const company = await prisma.company.findFirst({
    include: {
      reportingPeriods: {
        orderBy: { year: 'desc' },
        include: { entries: true },
      },
    },
  });

  if (!company) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Keine Unternehmensdaten gefunden.</p>
        <p className="text-sm text-gray-400">Bitte Datenbank initialisieren: npm run db:seed</p>
      </div>
    );
  }

  const periods = company.reportingPeriods;
  const latestPeriod = periods[0];
  const previousPeriod = periods[1];

  // Compute scope totals for the latest year
  const latestEntries = latestPeriod?.entries.map((e) => ({
    ...e,
    co2e: toNum(e.co2e),
    quantity: toNum(e.quantity),
  })) ?? [];

  const latestTotals = latestPeriod ? sumByScope(latestEntries) : { SCOPE1: 0, SCOPE2: 0, SCOPE3: 0 };
  const latestTotal = latestTotals.SCOPE1 + latestTotals.SCOPE2 + latestTotals.SCOPE3;

  // Compute scope totals for the previous year (for YoY comparison)
  const prevEntries = previousPeriod?.entries.map((e) => ({
    ...e,
    co2e: toNum(e.co2e),
    quantity: toNum(e.quantity),
  })) ?? [];

  const prevTotals = previousPeriod ? sumByScope(prevEntries) : null;
  const prevTotal = prevTotals ? prevTotals.SCOPE1 + prevTotals.SCOPE2 + prevTotals.SCOPE3 : null;

  // Year-over-year change percentage
  const yoyChange =
    prevTotal && prevTotal > 0
      ? (((latestTotal - prevTotal) / prevTotal) * 100).toFixed(1)
      : null;

  // Industry benchmark for the latest year
  const benchmark = latestPeriod
    ? await prisma.industryBenchmark.findFirst({
        where: { industry: company.industry, year: latestPeriod.year },
      })
    : null;

  const benchmarkTotal = benchmark
    ? toNum(benchmark.avgScope1Co2e) + toNum(benchmark.avgScope2Co2e) + toNum(benchmark.avgScope3Co2e)
    : null;

  // Category breakdown for chart
  const categoryBreakdown = latestEntries.reduce<Record<string, number>>((acc, e) => {
    const key = e.subcategory ? `${e.category} (${e.subcategory})` : e.category;
    acc[key] = (acc[key] ?? 0) + e.co2e;
    return acc;
  }, {});

  const year = latestPeriod?.year ?? new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-500 text-sm">
            {company.industry} · {company.location} · {company.employeeCount} Mitarbeiter
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/input"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Daten eingeben
          </Link>
          <a
            href="/api/report"
            className="bg-white border border-green-600 text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            PDF-Report
          </a>
          <a
            href="/api/badge"
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Badge
          </a>
          <a
            href="/api/csrd"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            CSRD-Fragebogen
          </a>
        </div>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Gesamt {year}</p>
          <p className="text-2xl font-bold text-gray-900">
            {(latestTotal / 1000).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">t CO₂e</p>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 shadow-sm border border-amber-100">
          <p className="text-xs text-amber-700 mb-1">Scope 1</p>
          <p className="text-2xl font-bold text-amber-800">
            {(latestTotals.SCOPE1 / 1000).toFixed(1)}
          </p>
          <p className="text-xs text-amber-600">t CO₂e</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
          <p className="text-xs text-blue-700 mb-1">Scope 2</p>
          <p className="text-2xl font-bold text-blue-800">
            {(latestTotals.SCOPE2 / 1000).toFixed(1)}
          </p>
          <p className="text-xs text-blue-600">t CO₂e</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-100">
          <p className="text-xs text-purple-700 mb-1">Scope 3</p>
          <p className="text-2xl font-bold text-purple-800">
            {(latestTotals.SCOPE3 / 1000).toFixed(1)}
          </p>
          <p className="text-xs text-purple-600">t CO₂e</p>
        </div>
      </div>

      {/* Charts section */}
      <DashboardCharts
        latestTotals={latestTotals}
        prevTotals={prevTotals}
        latestYear={year}
        prevYear={previousPeriod?.year}
        categoryBreakdown={categoryBreakdown}
        benchmarkTotal={benchmarkTotal ? benchmarkTotal : null}
        companyTotal={latestTotal}
        yoyChange={yoyChange}
      />

      {/* Industry benchmark */}
      {benchmark && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Branchenvergleich · {company.industry} {year}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                {
                  label: 'Scope 1',
                  company: latestTotals.SCOPE1,
                  bench: toNum(benchmark.avgScope1Co2e),
                  color: 'amber',
                },
                {
                  label: 'Scope 2',
                  company: latestTotals.SCOPE2,
                  bench: toNum(benchmark.avgScope2Co2e),
                  color: 'blue',
                },
                {
                  label: 'Scope 3',
                  company: latestTotals.SCOPE3,
                  bench: toNum(benchmark.avgScope3Co2e),
                  color: 'purple',
                },
              ] as Array<{ label: string; company: number; bench: number; color: string }>
            ).map(({ label, company: compVal, bench, color }) => {
              const ratio = bench > 0 ? (compVal / bench) * 100 : 100;
              const better = compVal <= bench;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="font-medium">{label}</span>
                    <span className={better ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                      {better ? '✓ besser' : '▲ höher'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-gray-500">Ihr Betrieb:</span>
                    <span className="font-semibold">{(compVal / 1000).toFixed(1)} t</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-gray-500">Branche Ø:</span>
                    <span className="text-gray-600">{(bench / 1000).toFixed(1)} t</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        color === 'amber'
                          ? 'bg-amber-400'
                          : color === 'blue'
                          ? 'bg-blue-400'
                          : 'bg-purple-400'
                      }`}
                      style={{ width: `${Math.min(ratio, 150)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{ratio.toFixed(0)} % des Branchendurchschnitts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emission detail table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Emissionsdetails · {year}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Scope
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Kategorie
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Menge
                </th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  CO₂e (kg)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {latestEntries.map((entry, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        entry.scope === 'SCOPE1'
                          ? 'bg-amber-100 text-amber-700'
                          : entry.scope === 'SCOPE2'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {entry.scope.replace('SCOPE', 'S')}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-700">
                    {entry.category}
                    {entry.subcategory && (
                      <span className="text-gray-400 text-xs ml-1">({entry.subcategory})</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-gray-500 text-xs">
                    {entry.quantity.toLocaleString('de-DE')} {entry.unit}
                  </td>
                  <td className="py-2 text-right font-semibold text-gray-800">
                    {entry.co2e.toLocaleString('de-DE', { maximumFractionDigits: 1 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={3} className="py-2 font-bold text-gray-700">
                  Gesamt
                </td>
                <td className="py-2 text-right font-bold text-gray-900">
                  {latestTotal.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
