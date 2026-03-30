'use client';

/**
 * UbaFillButton — stub placeholder for UBA emission factor auto-fill.
 *
 * The UBA auto-fill feature is not yet implemented. UBA values are managed
 * exclusively in the database. This button is shown as disabled with a
 * tooltip indicating the feature is coming soon.
 */

export function UbaFillButton() {
  return (
    <div title="UBA-Werte automatisch übernehmen ist noch nicht verfügbar.">
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-brand-green bg-white px-4 py-2 text-sm font-semibold text-brand-green opacity-40 cursor-not-allowed"
      >
        UBA-Werte übernehmen
      </button>
    </div>
  );
}
