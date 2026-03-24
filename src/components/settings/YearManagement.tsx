'use client';

/**
 * Year management panel for the Settings page.
 * Allows adding the next reporting year and deleting existing ones.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createYear, deleteYear } from '@/lib/actions';

interface YearManagementProps {
  years: number[];
  nextYear: number;
}

export function YearManagement({ years, nextYear }: YearManagementProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAddYear() {
    setError(null);
    const result = await createYear(nextYear);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Berichtsjahr konnte nicht erstellt werden.');
    }
  }

  async function handleDeleteYear(year: number) {
    setError(null);
    const result = await deleteYear(year);
    if (result.success) {
      setPendingDelete(null);
      router.refresh();
    } else {
      setPendingDelete(null);
      setError(result.error ?? 'Berichtsjahr konnte nicht gelöscht werden.');
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {years.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">
            Noch keine Berichtsjahre vorhanden.
          </p>
        ) : (
          years.map((year) => (
            <div key={year} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-gray-800">{year}</span>

              {pendingDelete === year ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Alle Daten werden gelöscht. Fortfahren?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteYear(year)}
                  >
                    Löschen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDelete(null)}
                  >
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPendingDelete(year)}
                  title={`Berichtsjahr ${year} löschen`}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <Button
        variant="outline"
        onClick={handleAddYear}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Berichtsjahr {nextYear} hinzufügen
      </Button>
    </div>
  );
}
