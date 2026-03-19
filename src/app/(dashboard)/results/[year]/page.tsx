/**
 * Results page — displays CO₂ emissions for a given year with benchmark comparison.
 * Renders Scope 1, Scope 2, total emissions, and a bar chart vs. sector benchmarks.
 */
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCompany } from '@/services/companies';
import { getEnergyEntry } from '@/services/energy-entries';
import { getBenchmark } from '@/lib/benchmarks';

interface ResultsPageProps {
  params: { year: string };
}

export async function generateMetadata({ params }: ResultsPageProps) {
  return { title: `CO₂-Bilanz ${params.year} – GrünBilanz` };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const year = parseInt(params.year, 10);
  if (isNaN(year)) notFound();

  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const company = await getCompany(session.user.id);
  if (!company) redirect('/onboarding');

  const entry = await getEnergyEntry(company.id, year);
  if (!entry) notFound();

  const benchmark = getBenchmark(company.branche);

  // Scale for bar chart: use 120% of p75 as the max width reference
  const maxVal = benchmark.p75_t * 1.2;
  const toPercent = (val: number) =>
    Math.min(100, Math.round((val / maxVal) * 100));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            CO₂-Bilanz {year}
          </h1>
          <p className="text-gray-600 mt-1">{company.name} · {company.branche}</p>
        </div>
        <a
          href={`/api/report/${year}`}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          📄 PDF herunterladen
        </a>
      </div>

      {/* Emissions summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Scope 1 (Direkt)
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {entry.co2_scope1_t.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Tonnen CO₂</div>
          <div className="text-xs text-gray-400 mt-2">
            Erdgas, Diesel, Heizöl
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Scope 2 (Indirekt)
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {entry.co2_scope2_t.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Tonnen CO₂</div>
          <div className="text-xs text-gray-400 mt-2">Strom</div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-5">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
            Gesamt
          </div>
          <div className="text-3xl font-bold text-green-700">
            {entry.co2_total_t.toFixed(2)}
          </div>
          <div className="text-sm text-green-600 mt-1">Tonnen CO₂</div>
          <div className="text-xs text-green-500 mt-2">Scope 1 + Scope 2</div>
        </div>
      </div>

      {/* Benchmark comparison bar chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Branchenvergleich – {company.branche}
        </h2>
        <div className="space-y-4">
          {/* Your company */}
          <BenchmarkBar
            label="Ihr Betrieb"
            value={entry.co2_total_t}
            percent={toPercent(entry.co2_total_t)}
            colorClass="bg-green-500"
          />
          {/* p25 */}
          <BenchmarkBar
            label="25. Perzentile (Branche)"
            value={benchmark.p25_t}
            percent={toPercent(benchmark.p25_t)}
            colorClass="bg-blue-200"
          />
          {/* Median */}
          <BenchmarkBar
            label="Median (Branche)"
            value={benchmark.median_t}
            percent={toPercent(benchmark.median_t)}
            colorClass="bg-blue-400"
          />
          {/* p75 */}
          <BenchmarkBar
            label="75. Perzentile (Branche)"
            value={benchmark.p75_t}
            percent={toPercent(benchmark.p75_t)}
            colorClass="bg-blue-600"
          />
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Werte in Tonnen CO₂/Jahr. Benchmarks basieren auf deutschen
          Handwerksbetrieben (Quelle: BMWi Handwerk-Energiebericht 2023).
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Link
          href="/energy"
          className="text-sm text-green-700 hover:text-green-800 underline"
        >
          ← Neue Daten erfassen
        </Link>
      </div>
    </div>
  );
}

/** Simple CSS bar chart row component */
function BenchmarkBar({
  label,
  value,
  percent,
  colorClass,
}: {
  label: string;
  value: number;
  percent: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-700 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value.toFixed(1)} t CO₂</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className={`h-5 rounded-full transition-all ${colorClass}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
