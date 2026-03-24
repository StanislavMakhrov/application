/**
 * Settings page — manage reporting years and other app-level configuration.
 */

import Link from 'next/link';
import { Leaf, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { YearManagement } from '@/components/settings/YearManagement';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const allYears = await prisma.reportingYear.findMany({ orderBy: { year: 'asc' } });
  const years = allYears.map((y: { year: number }) => y.year);
  const nextYear = years.length > 0 ? years[years.length - 1] + 1 : new Date().getFullYear();

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

        {/* Year management */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Berichtsjahre</h2>
          <p className="text-sm text-gray-500 mb-5">
            Berichtsjahre hinzufügen oder löschen. Das Löschen eines Jahres entfernt dauerhaft
            alle zugehörigen Emissionsdaten.
          </p>
          <YearManagement years={years} nextYear={nextYear} />
        </section>
      </div>
    </div>
  );
}
