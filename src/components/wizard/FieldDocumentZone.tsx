'use client';

/**
 * FieldDocumentZone — document attachment zone under every numeric input field.
 *
 * Shows a list of all attached documents (invoices, receipts) for a given
 * field/year combination. Each document displays:
 * - Filename
 * - "Erkannter Wert: X unit" in green (when recognizedValue is set)
 * - Month dropdown (optional; lets the user tag which month the invoice covers)
 * - "Jahresabrechnung" checkbox (annual invoice — drives sum-replacement logic in parent)
 *
 * The onDocumentsChange callback fires whenever the document list changes
 * (upload, remove, or per-doc metadata PATCH). Parents use this to recalculate
 * running totals using the calculateTotal helper pattern.
 *
 * Props:
 * - suppressInitialUpload: when true, hides the "Rechnung hochladen" button in
 *   the empty state — used when UploadOCR is already handling uploads for this field.
 * - refreshKey: increment this value from the parent to trigger a re-fetch of the
 *   document list (e.g., after UploadOCR creates a new FieldDocument).
 * - onDocumentsChange: called with the updated document list after any mutation.
 */

import { useEffect, useRef, useState } from 'react';

export interface FieldDocument {
  id: number;
  filePath: string;
  originalFilename: string;
  mimeType: string;
  uploadedAt: string;
  recognizedValue: number | null;
  billingMonth: number | null;
  isJahresabrechnung: boolean;
}

interface FieldDocumentZoneProps {
  fieldKey: string;
  year: number;
  /**
   * When true, the "Rechnung hochladen" button in the empty state is hidden.
   * Use when UploadOCR is already providing an upload trigger for this field,
   * to avoid showing two separate upload buttons.
   */
  suppressInitialUpload?: boolean;
  /**
   * Increment this counter from the parent to re-fetch the document list.
   * Useful after UploadOCR creates a FieldDocument so the zone refreshes
   * without requiring a full page reload.
   */
  refreshKey?: number;
  /**
   * Called with the updated document list after any mutation (upload, remove,
   * or per-doc metadata change). Use to recalculate running totals:
   *   onDocumentsChange={(docs) => setValue('erdgas', calculateTotal(docs))}
   */
  onDocumentsChange?: (docs: FieldDocument[]) => void;
}

/** Soft-limit warning threshold — shown when many documents are attached. */
const SOFT_LIMIT = 20;

/** German month names for the billing month dropdown. */
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/**
 * Maps fieldKey to the display unit for "Erkannter Wert".
 * Derived from OCR stub categories — keeps the unit display consistent with OCR output.
 */
const FIELD_UNIT_MAP: Record<string, string> = {
  STROM: 'kWh',
  FERNWAERME: 'kWh',
  ERDGAS: 'm³',
  HEIZOEL: 'L',
  FLUESSIGGAS: 'kg',
  DIESEL_FUHRPARK: 'L',
  BENZIN_FUHRPARK: 'L',
  GESCHAEFTSREISEN_FLUG: 'km',
  GESCHAEFTSREISEN_BAHN: 'km',
};

export function FieldDocumentZone({
  fieldKey,
  year,
  suppressInitialUpload = false,
  refreshKey = 0,
  onDocumentsChange,
}: FieldDocumentZoneProps) {
  const [docs, setDocs] = useState<FieldDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-fetch whenever fieldKey, year, or refreshKey changes.
  // refreshKey allows the parent (e.g., Screen2) to trigger a refresh after
  // UploadOCR atomically creates a FieldDocument via /api/ocr.
  useEffect(() => {
    fetch(`/api/field-documents?fieldKey=${encodeURIComponent(fieldKey)}&year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const fetched = data as FieldDocument[];
          setDocs(fetched);
          onDocumentsChange?.(fetched);
        }
      })
      .catch(() => {});
  // onDocumentsChange intentionally omitted from deps — it's a callback prop that
  // would cause an infinite loop if the parent creates a new function reference on
  // each render. The parent should memoize it with useCallback if needed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldKey, year, refreshKey]);

  /** Update local state and notify parent after any document list change. */
  const applyDocs = (updated: FieldDocument[]) => {
    setDocs(updated);
    onDocumentsChange?.(updated);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldKey', fieldKey);
      formData.append('year', String(year));
      const res = await fetch('/api/field-documents', { method: 'POST', body: formData });
      if (res.ok) {
        const newDoc = await res.json() as FieldDocument;
        applyDocs([...docs, newDoc]);
      } else {
        setUploadError('Upload fehlgeschlagen. Bitte erneut versuchen.');
      }
    } catch {
      setUploadError('Netzwerkfehler beim Upload.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/field-documents/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        applyDocs(docs.filter((d) => d.id !== id));
      }
    } finally {
      setRemovingId(null);
    }
  };

  /**
   * Sends a PATCH to update per-doc metadata and refreshes the local doc list.
   * Triggers onDocumentsChange so parent can recalculate the field total.
   */
  const handlePatch = async (
    id: number,
    patch: { billingMonth?: number | null; isJahresabrechnung?: boolean }
  ) => {
    try {
      const res = await fetch(`/api/field-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated = await res.json() as FieldDocument;
        applyDocs(docs.map((d) => (d.id === id ? updated : d)));
      }
    } catch {
      // PATCH failure is non-critical; UI shows the optimistic state regardless
    }
  };

  /**
   * Handles Jahresabrechnung checkbox changes with mutual exclusion.
   *
   * Only ONE document per zone may be marked as the annual invoice (Jahresabrechnung).
   * Behaves like a radio-button group styled as a checkbox: checking one document
   * automatically unchecks all other documents in the same zone.
   *
   * Implementation:
   * 1. Apply an optimistic update immediately so the UI responds without waiting
   *    for server round-trips (set the chosen doc to true, all others to false).
   * 2. PATCH the chosen document to isJahresabrechnung: true.
   * 3. PATCH every previously-checked sibling document to isJahresabrechnung: false.
   *    Only documents that were actually checked need a PATCH (avoids redundant calls).
   */
  const handleJahresabrechnungChange = (id: number, checked: boolean) => {
    if (checked) {
      // Save state before the optimistic update so we can roll back on failure
      const previousDocs = docs;

      // Optimistic update: reflect the exclusive selection immediately in the UI
      applyDocs(docs.map((d) => ({ ...d, isJahresabrechnung: d.id === id })));

      // Sync the newly-checked document to the server; roll back on failure
      fetch(`/api/field-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isJahresabrechnung: true }),
      }).catch((err) => {
        console.error('Failed to set Jahresabrechnung on document', id, err);
        applyDocs(previousDocs);
      });

      // Uncheck all previously-checked siblings — only PATCH those that need to change
      docs
        .filter((d) => d.id !== id && d.isJahresabrechnung)
        .forEach((d) => {
          fetch(`/api/field-documents/${d.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isJahresabrechnung: false }),
          }).catch((err) => {
            console.error('Failed to uncheck Jahresabrechnung on sibling document', d.id, err);
            applyDocs(previousDocs);
          });
        });
    } else {
      // Simple uncheck — no exclusion logic needed when unchecking
      handlePatch(id, { isJahresabrechnung: false });
    }
  };

  const unit = FIELD_UNIT_MAP[fieldKey] ?? 'Einheit';
  // Show the "+ Beleg hinzufügen" button only once at least one document exists.
  // The empty-state area renders a separate upload button when !suppressInitialUpload,
  // so showing this button in the empty state would create a duplicate upload trigger.
  const showAddButton = docs.length > 0;

  return (
    <div className="space-y-1.5">
      {/* Document list */}
      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="rounded-md border border-green-400 bg-green-50 px-3 py-2 text-sm space-y-1.5"
            >
              {/* Filename row */}
              <div className="flex items-center gap-2">
                <span className="text-green-600 shrink-0" aria-hidden="true">✓ 📄</span>
                <span className="flex-1 truncate text-green-800 font-medium" title={doc.originalFilename}>
                  {doc.originalFilename}
                </span>
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded border border-green-400 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100"
                >
                  Ansehen
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(doc.id)}
                  disabled={removingId === doc.id}
                  className="shrink-0 rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Dokument ${doc.originalFilename} entfernen`}
                >
                  {removingId === doc.id ? '…' : 'Entfernen'}
                </button>
              </div>

              {/* Erkannter Wert — shown when OCR produced a value */}
              {doc.recognizedValue != null && (
                <p className="text-xs text-green-700 font-medium pl-6">
                  Erkannter Wert: {doc.recognizedValue.toLocaleString('de-DE')} {unit}
                </p>
              )}

              {/* Per-doc metadata: month dropdown + Jahresabrechnung checkbox */}
              <div className="flex items-center gap-4 pl-6">
                {/* Billing month dropdown */}
                <label className="flex items-center gap-1.5 text-xs text-green-800">
                  <span>Monat:</span>
                  <select
                    value={doc.billingMonth ?? ''}
                    onChange={(e) =>
                      handlePatch(doc.id, {
                        billingMonth: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="rounded border border-green-300 bg-white px-1.5 py-0.5 text-xs text-green-900 focus:outline-none focus:ring-1 focus:ring-green-400"
                  >
                    <option value="">— kein Monat —</option>
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Jahresabrechnung checkbox — mutually exclusive within this zone:
                    checking one document automatically unchecks all others. */}
                <label className="flex items-center gap-1.5 text-xs text-green-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doc.isJahresabrechnung}
                    onChange={(e) =>
                      handleJahresabrechnungChange(doc.id, e.target.checked)
                    }
                    className="rounded border-green-400 text-green-600 focus:ring-green-400"
                  />
                  Jahresabrechnung
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state — shown when no documents are attached yet */}
      {docs.length === 0 && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
          <span aria-hidden="true">📄</span>
          <span>Kein Dokument hochgeladen</span>
          {/* The upload button is hidden when UploadOCR is already handling uploads
              for this field, to avoid showing two separate upload triggers. */}
          {!suppressInitialUpload && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="ml-auto shrink-0 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
            >
              {isUploading ? 'Wird hochgeladen…' : 'Rechnung hochladen'}
            </button>
          )}
        </div>
      )}

      {/* "+ Beleg hinzufügen" button — visible once at least one doc exists.
          Uses the shared hidden file input so uploads go through the same handler. */}
      {showAddButton && (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <span aria-hidden="true">➕</span>
          {isUploading ? 'Wird hochgeladen…' : '+ Beleg hinzufügen'}
        </button>
      )}

      {/* Soft-limit warning: shown when many documents are attached */}
      {docs.length >= SOFT_LIMIT && (
        <p className="text-xs text-amber-600">
          ⚠️ {docs.length} Dokumente angehängt — bitte prüfen Sie, ob alle notwendig sind.
        </p>
      )}

      {uploadError && (
        <p className="text-xs text-red-600">{uploadError}</p>
      )}

      {/* Hidden file input shared by both upload buttons */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
        aria-label="Beleg hochladen"
      />
    </div>
  );
}

