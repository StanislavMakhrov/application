'use client';

/**
 * Screen 1 — Firmenprofil & Berichtsgrenzen (read-only summary)
 *
 * Displays the current company profile values for reference during data entry.
 * Editing is no longer possible here — users must navigate to the Settings page.
 * This prevents accidental global changes while working on a specific reporting year.
 * See: docs/features/001-company-settings-ui/adr/adr-001-screen1-readonly-vs-removal.md
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WizardNav } from '@/components/wizard/WizardNav';
import { BRANCHE_LABELS } from '@/types';
import type { Branche } from '@/types';

interface CompanyProfile {
  firmenname: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
  reportingBoundaryNotes?: string | null;
  exclusions?: string | null;
}

/** Renders a labeled read-only field row. */
function ProfileRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-gray-100 last:border-0">
      <dt className="sm:w-56 text-sm font-medium text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">
        {value ?? <span className="text-gray-400 italic">nicht angegeben</span>}
      </dd>
    </div>
  );
}

export default function Screen1Firmenprofil() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    fetch('/api/entries?type=profile')
      .then((r) => r.json())
      .then((data) => {
        if (data?.firmenname) setProfile(data as CompanyProfile);
      })
      .catch(() => {/* profile may not exist yet */});
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Firmenprofil & Berichtsgrenzen</h1>
      <p className="text-sm text-gray-500 mb-4">
        Grunddaten Ihres Betriebs — erscheinen auf dem PDF-Bericht.
      </p>

      {/* Info callout: editing moved to Settings */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span className="shrink-0 text-base" aria-hidden="true">ℹ️</span>
        <p>
          Firmenprofil-Daten können in den{' '}
          <Link
            href="/settings"
            className="font-semibold underline underline-offset-2 hover:text-amber-900"
          >
            Einstellungen
          </Link>{' '}
          geändert werden.
        </p>
      </div>

      {profile ? (
        <dl>
          <ProfileRow label="Firmenname" value={profile.firmenname} />
          <ProfileRow label="Branche" value={BRANCHE_LABELS[profile.branche] ?? profile.branche} />
          <ProfileRow label="Mitarbeitende" value={profile.mitarbeiter} />
          <ProfileRow label="Standort(e)" value={profile.standort} />
          <ProfileRow label="Berichtsgrenzen" value={profile.reportingBoundaryNotes} />
          <ProfileRow label="Ausschlüsse & Annahmen" value={profile.exclusions} />
        </dl>
      ) : (
        /* Empty state — profile not yet configured */
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Firmendaten noch nicht hinterlegt — bitte in den Einstellungen erfassen.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-green px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Einstellungen öffnen →
          </Link>
        </div>
      )}

      <WizardNav currentScreen={1} />
    </div>
  );
}

