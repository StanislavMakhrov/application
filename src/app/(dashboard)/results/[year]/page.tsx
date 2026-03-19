import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getCompanyByUserId } from '@/services/companies';
import { getEnergyEntryByYear } from '@/services/energy-entries';
import { getBenchmark } from '@/lib/benchmarks';
import { BenchmarkChart } from '@/components/charts/BenchmarkChart';
import { UBA_2024 } from '@/lib/emission-factors';
import Link from 'next/link';

export const metadata = { title: 'CO₂-Ergebnisse – GrünBilanz' };

interface PageProps {
  params: Promise<{ year: string }>;
}

/**
 * Results page: displays CO₂ totals, breakdown, and benchmark comparison.
 * Requires both an authenticated session and a completed energy entry for the year.
 */
export default async function ResultsPage({ params }: PageProps) {
  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);

  const user = await getUser();
  if (!user) redirect('/login');

  const company = await getCompanyByUserId(user.id).catch(() => null);
  if (!company) redirect('/onboarding');

  const entry = await getEnergyEntryByYear(company.id, year).catch(() => null);
  if (!entry) redirect('/energy');

  const benchmark = getBenchmark(company.branche);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-900">CO₂-Bilanz {year}</h1>
          <p className="text-gray-600 mt-1">{company.name}</p>
        </div>
        <a
          href={`/api/report/${year}`}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          📄 PDF herunterladen
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Gesamt CO₂"
          value={`${entry.co2_total_t.toFixed(2)} t`}
          color="green"
          description="CO₂e gesamt"
        />
        <SummaryCard
          label="Scope 1 (Verbrennung)"
          value={`${entry.co2_scope1_t.toFixed(2)} t`}
          color="orange"
          description="Erdgas, Diesel, Heizöl"
        />
        <SummaryCard
          label="Scope 2 (Strom)"
          value={`${entry.co2_scope2_t.toFixed(2)} t`}
          color="blue"
          description="Strombezug"
        />
      </div>

      {/* Benchmark Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Branchenvergleich: {company.branche}
        </h2>
        <BenchmarkChart
          companyTotal={entry.co2_total_t}
          benchmark={benchmark}
          companyName={company.name}
        />
      </div>

      {/* Scope Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Aufschlüsselung nach Scope</h2>
        <div className="space-y-3">
          <BreakdownRow
            label="Erdgas"
            value={(entry.erdgas_m3 * UBA_2024.erdgas_m3) / 1000}
            unit="t CO₂"
            color="orange"
          />
          <BreakdownRow
            label="Diesel"
            value={(entry.diesel_l * UBA_2024.diesel_l) / 1000}
            unit="t CO₂"
            color="red"
          />
          <BreakdownRow
            label="Heizöl"
            value={(entry.heizoel_l * UBA_2024.heizoel_l) / 1000}
            unit="t CO₂"
            color="yellow"
          />
          <BreakdownRow
            label="Strom (Scope 2)"
            value={entry.co2_scope2_t}
            unit="t CO₂"
            color="blue"
          />
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center py-2">
        Berechnet nach GHG Protocol Scope 1 &amp; 2, UBA 2024 Emissionsfaktoren.
        Angaben ohne Gewähr.
      </p>

      <div className="flex gap-3">
        <Link
          href="/energy"
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          ← Energiedaten bearbeiten
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: string;
  color: 'green' | 'orange' | 'blue';
  description: string;
}) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs mt-1 opacity-60">{description}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {value.toFixed(3)} {unit}
      </span>
    </div>
  );
}
