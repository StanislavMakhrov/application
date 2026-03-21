'use client';

/**
 * UploadOCR — file upload button that calls the OCR API to extract values
 * from uploaded utility bills.
 *
 * On success, calls onResult with the extracted value so the parent form
 * can pre-fill the appropriate field.
 */

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface UploadOCRProps {
  category: string;
  onResult: (value: number, confidence: number) => void;
  label?: string;
}

export function UploadOCR({ category, onResult, label = 'Rechnung hochladen' }: UploadOCRProps) {
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

      const res = await fetch('/api/ocr', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Erkannt: ${data.value} ${data.unit} (Konfidenz: ${Math.round(data.confidence * 100)}%)`,
          { id: toastId }
        );
        onResult(data.value, data.confidence);
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
