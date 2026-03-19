/**
 * Reports page — overview of all available CO₂ reports (one per year).
 *
 * Lists all years for which energy data has been entered, with links to
 * the results page and PDF download for each year.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getCompanyByUserId } from '@/services/companies';
import { getEnergyEntriesByCompany } from '@/services/energy-entries';

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getCompanyByUserId(user.id);
  if (!company) redirect('/onboarding');

  const entries = await getEnergyEntriesByCompany(company.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Berichte</h1>
          <p className="mt-1 text-sm text-gray-500">{company.name}</p>
        </div>
        <Link
          href="/energy"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          + Neuer Eintrag
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <p className="text-4xl">📊</p>
          <p className="mt-3 font-medium text-gray-700">Noch keine Berichte vorhanden</p>
          <p className="mt-1 text-sm text-gray-400">
            Geben Sie Ihre Energiedaten ein, um einen CO₂-Bericht zu erstellen.
          </p>
          <Link
            href="/energy"
            className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Energiedaten erfassen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
            >
              <div>
                <p className="font-semibold text-gray-900">{entry.year}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {entry.co2TotalT.toFixed(2)} t CO₂e gesamt
                </p>
                <div className="mt-1 flex gap-3 text-xs text-gray-400">
                  <span>Scope 1: {entry.co2Scope1T.toFixed(2)} t</span>
                  <span>Scope 2: {entry.co2Scope2T.toFixed(2)} t</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/results/${entry.year}`}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-green-600 ring-1 ring-green-200 hover:bg-green-50"
                >
                  Ansehen
                </Link>
                <a
                  href={`/api/report/${entry.year}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                >
                  PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
