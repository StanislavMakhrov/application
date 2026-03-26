'use client';

/**
 * UploadOCR — file upload button that calls the OCR API to extract values
 * from uploaded utility bills.
 *
 * On success, calls onResult with the extracted value, confidence score,
 * and the documentId of the stored source file (for audit trail linkage).
 *
 * Optional props fieldKey + year cause the upload to also create a FieldDocument
 * record (invoice stored as field evidence). onDocumentStored is called with the
 * new document so the parent can refresh its FieldDocumentZone.
 */

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface StoredDocument {
  id: number;
  originalFilename: string;
  filePath: string;
  /** OCR-extracted value persisted to FieldDocument.recognizedValue */
  recognizedValue?: number;
}

interface UploadOCRProps {
  category: string;
  // documentId is undefined when OCR does not persist a document (should not happen in normal flow)
  onResult: (value: number, confidence: number, documentId?: number) => void;
  label?: string;
  /** When set, the uploaded file is also stored as a FieldDocument for this field/year */
  fieldKey?: string;
  /** Reporting year — required when fieldKey is provided */
  year?: number;
  /** Called after the FieldDocument is created; use to refresh FieldDocumentZone */
  onDocumentStored?: (doc: StoredDocument) => void;
}

export function UploadOCR({
  category,
  onResult,
  label = 'Rechnung hinzufügen',
  fieldKey,
  year,
  onDocumentStored,
}: UploadOCRProps) {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const toastId = toast.loading('OCR läuft... Bitte warten.');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      // Optionally request FieldDocument creation alongside OCR processing
      if (fieldKey && year !== undefined) {
        formData.append('fieldKey', fieldKey);
        formData.append('year', String(year));
      }

      const res = await fetch('/api/ocr', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Erkannt: ${data.value} ${data.unit} (Konfidenz: ${Math.round(data.confidence * 100)}%)`,
          { id: toastId }
        );
        onResult(data.value, data.confidence, data.documentId as number | undefined);

        // Notify parent that a FieldDocument was also stored (triggers zone refresh)
        if (data.fieldDocumentId && onDocumentStored) {
          onDocumentStored({
            id: data.fieldDocumentId as number,
            originalFilename: file.name,
            filePath: (data.fieldDocument as { filePath?: string })?.filePath ?? '',
            recognizedValue: typeof data.value === 'number' ? data.value : undefined,
          });
        }
      } else {
        toast.error(`OCR Fehler: ${data.error ?? 'Unbekannter Fehler'}`, { id: toastId });
      }
    } catch {
      toast.error('OCR konnte nicht gestartet werden.', { id: toastId });
    } finally {
      setIsLoading(false);
      // Reset file input so the same file can be re-uploaded
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
        aria-label={label}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? '⏳ Verarbeite...' : `📄 ${label}`}
      </Button>
    </div>
  );
}
