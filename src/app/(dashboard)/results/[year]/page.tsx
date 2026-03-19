/**
 * Results page — displays the CO₂ footprint for a specific year.
 *
 * Shows:
 * - Total CO₂ in tonnes (prominent hero number)
 * - Scope 1 / Scope 2 breakdown
 * - Benchmark comparison chart (peer industry data)
 * - Link to download the PDF report
 */
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getCompanyByUserId } from '@/services/companies';
import { getEnergyEntryByYear } from '@/services/energy-entries';
import { getBenchmark, type Branche } from '@/lib/benchmarks';
import BenchmarkChart from '@/components/BenchmarkChart';

interface ResultsPageProps {
  params: Promise<{ year: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);
  if (isNaN(year)) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getCompanyByUserId(user.id);
  if (!company) redirect('/onboarding');

  const entry = await getEnergyEntryByYear(company.id, year);
  if (!entry) {
    // No data for this year — send user back to enter data
    redirect('/energy');
  }

  const benchmark = getBenchmark(company.branche as Branche, 2024);

  // Determine performance label relative to benchmark median.
  // Full class strings are defined here so Tailwind's static scanner can detect them.
  const performance =
    benchmark === undefined
      ? null
      : entry.co2TotalT < benchmark.p25_t
        ? { label: 'Sehr gut', badgeClass: 'bg-white/20 text-green-200' as const }
        : entry.co2TotalT < benchmark.median_t
          ? { label: 'Gut', badgeClass: 'bg-white/20 text-green-100' as const }
          : entry.co2TotalT < benchmark.p75_t
            ? { label: 'Durchschnittlich', badgeClass: 'bg-white/20 text-yellow-200' as const }
            : { label: 'Verbesserungspotenzial', badgeClass: 'bg-white/20 text-red-200' as const };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CO₂-Bericht {year}</h1>
        <Link
          href="/energy"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          ← Neue Daten eingeben
        </Link>
      </div>

      {/* Hero: Total CO₂ */}
      <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wider opacity-80">
          Gesamtemissionen {year}
        </p>
        <p className="mt-2 text-6xl font-bold tabular-nums">
          {entry.co2TotalT.toFixed(2)}
        </p>
        <p className="mt-1 text-lg opacity-90">Tonnen CO₂e</p>
        {performance && (
          <p className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${performance.badgeClass}`}>
            {performance.label}
          </p>
        )}
      </div>

      {/* Scope breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Scope 1</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">
            {entry.co2Scope1T.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">t CO₂e · direkte Emissionen</p>
          <p className="mt-2 text-xs text-gray-400">Erdgas · Diesel · Heizöl</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Scope 2</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">
            {entry.co2Scope2T.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">t CO₂e · Stromverbrauch</p>
          <p className="mt-2 text-xs text-gray-400">Strom aus dem deutschen Netz</p>
        </div>
      </div>

      {/* Benchmark comparison */}
      {benchmark && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <BenchmarkChart companyTotal_t={entry.co2TotalT} benchmark={benchmark} />
        </div>
      )}

      {/* Input summary */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Energieverbrauch {year}</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-400">Strom</dt>
            <dd className="font-medium">{entry.stromKwh.toLocaleString('de-DE')} kWh</dd>
          </div>
          <div>
            <dt className="text-gray-400">Erdgas</dt>
            <dd className="font-medium">{entry.erdgasM3.toLocaleString('de-DE')} m³</dd>
          </div>
          <div>
            <dt className="text-gray-400">Diesel</dt>
            <dd className="font-medium">{entry.dieselL.toLocaleString('de-DE')} L</dd>
          </div>
          <div>
            <dt className="text-gray-400">Heizöl</dt>
            <dd className="font-medium">{entry.heizoeL.toLocaleString('de-DE')} L</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-gray-400">
          Emissionsfaktoren: UBA 2024 · Methodik: GHG Protocol Scope 1 &amp; 2
        </p>
      </div>

      {/* PDF download */}
      <div className="flex justify-center pb-4">
        <a
          href={`/api/report/${year}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          PDF-Bericht herunterladen
        </a>
      </div>
    </div>
  );
}
