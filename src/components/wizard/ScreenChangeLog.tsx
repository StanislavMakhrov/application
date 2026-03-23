'use client';

/**
 * ScreenChangeLog — shows the last 5 changes for a set of categories.
 * Collapsed by default, appears at the bottom of each wizard screen.
 * Helps users see a quick history of what was entered in this section.
 */

import { useEffect, useState } from 'react';

interface ChangeEntry {
  id: number;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  inputMethod: string;
  createdAt: string;
  metadata: string | null;
  document: { id: number; filename: string } | null;
}

interface ScreenChangeLogProps {
  yearId: number | null;
  categories: string[];
  title?: string;
}

/** Extracts the category label from the audit log metadata JSON. */
function parseCategory(metadata: string | null): string {
  if (!metadata) return '';
  try {
    const p = JSON.parse(metadata) as Record<string, unknown>;
    return String(p.category ?? p.material ?? '');
  } catch (err) {
    console.warn('ScreenChangeLog: failed to parse metadata JSON', err);
    return '';
  }
}

export function ScreenChangeLog({ yearId, categories, title = 'Änderungsprotokoll für diesen Abschnitt' }: ScreenChangeLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<ChangeEntry[]>([]);

  useEffect(() => {
    if (!isOpen || !yearId) return;
    const params = new URLSearchParams({ yearId: String(yearId), limit: '5' });
    categories.forEach((c) => params.append('category', c));
    fetch(`/api/audit?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { logs?: ChangeEntry[] }) => {
        setEntries(d.logs ?? []);
      })
      .catch(() => {});
  }, [isOpen, yearId, categories]);

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-gray-600">🗒 {title}</span>
        <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-4 space-y-2">
          {entries.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Keine Änderungen in diesem Abschnitt.</p>
          ) : (
            entries.map((e) => {
              const cat = parseCategory(e.metadata);
              const date = new Date(e.createdAt).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit',
              });
              return (
                <div key={e.id} className="text-xs text-gray-600 border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-gray-400">{date}</span>
                  {' '}
                  {cat && <span className="font-medium">{cat}</span>}
                  {e.action === 'CREATE' && ` erstmals erfasst: ${e.newValue ?? '—'}`}
                  {e.action === 'UPDATE' && ` geändert: ${e.oldValue ?? '—'} → ${e.newValue ?? '—'}`}
                  {e.action === 'DELETE' && ` gelöscht (war: ${e.oldValue ?? '—'})`}
                  {e.document && (
                    <span className="ml-2 text-gray-400">· {e.document.filename} hochgeladen</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
