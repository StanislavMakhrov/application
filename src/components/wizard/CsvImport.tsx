'use client';

/**
 * CsvImport — allows importing values from a DATEV or similar CSV export.
 * Shows a category mapping UI and populates fields on successful import.
 *
 * The documentId returned by the API is passed to onResult so parent
 * screens can link it to their saveEntry calls for full audit traceability.
 */

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface CsvImportProps {
  categories: string[];
  // documentId is the ID of the stored CSV file returned by the API
  onResult: (values: Record<string, number>, documentId?: number) => void;
}

export function CsvImport({ categories, onResult }: CsvImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const toastId = toast.loading('CSV wird importiert...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Use a simple 1:1 mapping where column name = category key (stub behavior)
      const mapping: Record<string, string> = {};
      for (const cat of categories) {
        mapping[cat] = cat;
      }
      formData.append('mapping', JSON.stringify(mapping));

      const res = await fetch('/api/csv', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        const count = Object.keys(data.values ?? {}).length;
        toast.success(`${count} Werte aus CSV importiert.`, { id: toastId });
        onResult(data.values ?? {}, data.documentId as number | undefined);
      } else {
        toast.error(`CSV Fehler: ${data.error ?? 'Unbekannter Fehler'}`, { id: toastId });
      }
    } catch {
      toast.error('CSV-Import fehlgeschlagen.', { id: toastId });
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        aria-label="CSV importieren"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? '⏳ Importiere...' : '📊 CSV importieren'}
      </Button>
    </div>
  );
}
