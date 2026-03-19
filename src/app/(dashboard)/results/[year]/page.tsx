/**
 * CO₂ results page for a given reporting year.
 *
 * Shows the Scope 1, Scope 2 and total CO₂ figures alongside an industry
 * benchmark comparison. Provides links to download the PDF report and to
 * return to the energy input form.
 */
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCompany } from '@/services/companies';
import { getEnergyEntry } from '@/services/energy-entries';
import { getBenchmark } from '@/lib/benchmarks';
import type { Branche, BenchmarkData } from '@/lib/benchmarks';

interface Props {
  params: Promise<{ year: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);

  if (isNaN(year)) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const company = await getCompany();
  if (!company) redirect('/onboarding');

  const entry = await getEnergyEntry(company.id, year);
  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Keine Daten für {year} vorhanden
        </h1>
        <p className="text-gray-600 mb-6">
          Bitte geben Sie zuerst Ihre Energieverbrauchsdaten für das Jahr {year} ein.
        </p>
        <Link
          href="/energy"
          className="inline-block bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
        >
          Energiedaten eingeben
        </Link>
      </div>
    );
  }

  const benchmark = getBenchmark(company.branche as Branche, year);
  const position = benchmark ? getBenchmarkPosition(entry.co2_total_t, benchmark) : '';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          CO₂-Bilanz {year} — {company.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {company.branche} · {company.mitarbeiter} Mitarbeiter · {company.standort}
        </p>
      </div>

      {/* CO₂ summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScopeCard
          label="Scope 1"
          subtitle="Direkte Emissionen"
          value={entry.co2_scope1_t}
          color="orange"
        />
        <ScopeCard
          label="Scope 2"
          subtitle="Strom (indirekt)"
          value={entry.co2_scope2_t}
          color="blue"
        />
        <ScopeCard
          label="Gesamt"
          subtitle="Scope 1 + 2"
          value={entry.co2_total_t}
          color="green"
          highlight
        />
      </div>

      {/* Energy inputs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Energieverbrauch</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Energieträger</th>
                <th className="pb-2 font-medium text-right">Menge</th>
                <th className="pb-2 font-medium text-right">Einheit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-2 text-gray-700">Strom</td>
                <td className="py-2 text-right font-mono">{entry.strom_kwh.toLocaleString('de-DE')}</td>
                <td className="py-2 text-right text-gray-500">kWh</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">Erdgas</td>
                <td className="py-2 text-right font-mono">{entry.erdgas_m3.toLocaleString('de-DE')}</td>
                <td className="py-2 text-right text-gray-500">m³</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">Diesel</td>
                <td className="py-2 text-right font-mono">{entry.diesel_l.toLocaleString('de-DE')}</td>
                <td className="py-2 text-right text-gray-500">L</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">Heizöl</td>
                <td className="py-2 text-right font-mono">{entry.heizoel_l.toLocaleString('de-DE')}</td>
                <td className="py-2 text-right text-gray-500">L</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark comparison */}
      {benchmark && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Branchenvergleich</h2>
          <p className="text-sm text-gray-500 mb-4">
            Vergleich mit anderen {company.branche}-Betrieben ({year})
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">P25 (effizient)</div>
              <div className="text-lg font-bold text-green-700">
                {benchmark.p25_t.toLocaleString('de-DE')} t
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Median</div>
              <div className="text-lg font-bold text-yellow-700">
                {benchmark.median_t.toLocaleString('de-DE')} t
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">P75 (viel)</div>
              <div className="text-lg font-bold text-red-700">
                {benchmark.p75_t.toLocaleString('de-DE')} t
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">
              {entry.co2_total_t <= benchmark.median_t ? '✅' : '⚠️'}
            </span>
            <div>
              <span className="font-medium text-gray-800">Ihr Betrieb: </span>
              <span className="font-bold text-gray-900">
                {entry.co2_total_t.toLocaleString('de-DE')} t CO₂
              </span>
              <span className="text-gray-600"> — {position}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`/api/report/${year}`}
          className="flex-1 text-center bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 rounded-lg transition-colors"
          download={`GruenBilanz_${company.name}_${year}.pdf`}
        >
          📄 PDF-Bericht herunterladen
        </a>
        <Link
          href="/energy"
          className="flex-1 text-center border border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-700 font-medium py-2.5 rounded-lg transition-colors"
        >
          ✏️ Daten bearbeiten
        </Link>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Berechnung nach GHG-Protokoll Scope 1 &amp; 2 · Emissionsfaktoren: UBA 2024
      </p>
    </div>
  );
}

interface ScopeCardProps {
  label: string;
  subtitle: string;
  value: number;
  color: 'orange' | 'blue' | 'green';
  highlight?: boolean;
}

function ScopeCard({ label, subtitle, value, color, highlight }: ScopeCardProps) {
  const colorClasses = {
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: highlight
      ? 'bg-green-700 text-white border-green-700'
      : 'bg-green-50 text-green-800 border-green-200',
  };

  return (
    <div className={`rounded-2xl border p-5 text-center ${colorClasses[color]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</div>
      <div className="text-3xl font-bold mb-1">{value.toLocaleString('de-DE')}</div>
      <div className="text-sm opacity-70">t CO₂</div>
      <div className="text-xs opacity-60 mt-1">{subtitle}</div>
    </div>
  );
}

/**
 * Determine qualitative CO₂ position relative to industry benchmark percentiles.
 *
 * @param total     Company's total CO₂ in tonnes.
 * @param benchmark Peer benchmark data for the same Branche and year.
 * @returns         German-language position label.
 */
function getBenchmarkPosition(total: number, benchmark: BenchmarkData): string {
  if (total <= benchmark.p25_t) return 'unterdurchschnittlich (Top 25 %)';
  if (total <= benchmark.median_t) return 'unterdurchschnittlich';
  if (total <= benchmark.p75_t) return 'überdurchschnittlich';
  return 'stark überdurchschnittlich (Top 25 % Emittenten)';
}
