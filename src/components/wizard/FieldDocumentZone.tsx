'use client';

/**
 * FieldDocumentZone — document attachment zone under every numeric input field.
 * Shows dashed border when no document, green border when document attached.
 * Allows uploading a PDF or image as evidence for the entered value.
 */

import { useEffect, useRef, useState } from 'react';

interface FieldDocument {
  id: number;
  filePath: string;
  originalFilename: string;
  mimeType: string;
}

interface FieldDocumentZoneProps {
  fieldKey: string;
  year: number;
}

export function FieldDocumentZone({ fieldKey, year }: FieldDocumentZoneProps) {
  const [doc, setDoc] = useState<FieldDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/field-documents?fieldKey=${encodeURIComponent(fieldKey)}&year=${year}`)
      .then((r) => r.json())
      .then((d) => setDoc(d))
      .catch(() => {});
  }, [fieldKey, year]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldKey', fieldKey);
      formData.append('year', String(year));
      const res = await fetch('/api/field-documents', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json() as FieldDocument;
        setDoc(data);
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (doc) {
    return (
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-green-400 bg-green-50 px-3 py-2 text-sm">
        <span className="text-green-600">✓ 📄</span>
        <span className="flex-1 truncate text-green-800">{doc.originalFilename}</span>
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
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded border border-green-400 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100"
        >
          Ersetzen
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
        />
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
      <span>📄 Kein Dokument hochgeladen</span>
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="ml-auto shrink-0 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
      >
        {isUploading ? 'Wird hochgeladen…' : 'Rechnung hochladen'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
      />
    </div>
  );
}
