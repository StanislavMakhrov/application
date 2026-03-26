'use client';

/**
 * FieldDocumentZone — document attachment zone under every numeric input field.
 *
 * Shows a list of all attached documents (invoices, receipts) for a given
 * field/year combination. Users can add multiple documents and remove individual
 * ones without affecting others.
 *
 * Props:
 * - suppressInitialUpload: when true, hides the "Rechnung hochladen" button in
 *   the empty state — used when UploadOCR is already handling uploads for this field.
 * - refreshKey: increment this value from the parent to trigger a re-fetch of the
 *   document list (e.g., after UploadOCR creates a new FieldDocument).
 */

import { useEffect, useRef, useState } from 'react';

interface FieldDocument {
  id: number;
  filePath: string;
  originalFilename: string;
  mimeType: string;
  uploadedAt: string;
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
}

/** Soft-limit warning threshold — shown when many documents are attached. */
const SOFT_LIMIT = 20;

export function FieldDocumentZone({
  fieldKey,
  year,
  suppressInitialUpload = false,
  refreshKey = 0,
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
        if (Array.isArray(data)) setDocs(data as FieldDocument[]);
      })
      .catch(() => {});
  }, [fieldKey, year, refreshKey]);

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
        setDocs((prev) => [...prev, newDoc]);
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
        setDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } finally {
      setRemovingId(null);
    }
  };

  const showAddButton = suppressInitialUpload || docs.length > 0;

  return (
    <div className="space-y-1.5">
      {/* Document list */}
      {docs.length > 0 && (
        <ul className="space-y-1">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-2 rounded-md border border-green-400 bg-green-50 px-3 py-2 text-sm"
            >
              <span className="text-green-600 shrink-0" aria-hidden="true">✓ 📄</span>
              <span className="flex-1 truncate text-green-800" title={doc.originalFilename}>
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

      {/* "Add another document" button — visible once at least one doc exists, or always
          when suppressInitialUpload is true (UploadOCR drives the primary upload). */}
      {showAddButton && (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <span aria-hidden="true">➕</span>
          {isUploading ? 'Wird hochgeladen…' : 'Weitere Rechnung hinzufügen'}
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
        aria-label="Rechnung hochladen"
      />
    </div>
  );
}

