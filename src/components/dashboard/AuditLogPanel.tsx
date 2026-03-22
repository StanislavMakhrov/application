'use client';

/**
 * AuditLogPanel — collapsible panel showing the 50 most recent data changes.
 *
 * Fetches from GET /api/audit on mount. Each row shows:
 *   Date | Entity type | Category | Action | Old value | New value | Input method | Source document
 *
 * When a documentId is present a download link points to
 * GET /api/documents/[id] which streams the original file.
 */

import { useEffect, useState } from 'react';

interface AuditEntry {
  id: number;
  entityType: string;
  entityId: number | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  inputMethod: string;
  metadata: string | null;
  createdAt: string;
  document: { id: number; filename: string; mimeType: string } | null;
}

// Action badge colours — green/yellow/red following traffic-light convention
const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

function parseCategory(metadata: string | null): string {
  if (!metadata) return '—';
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    return String(parsed.category ?? parsed.material ?? '—');
  } catch {
    return '—';
  }
}

export function AuditLogPanel({ yearId }: { yearId?: number }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch when the panel is expanded to avoid blocking page load
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (yearId) params.set('yearId', String(yearId));

    fetch(`/api/audit?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { logs?: AuditEntry[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setLogs(data.logs ?? []);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, yearId]);

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Collapsible header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <h2 className="text-sm font-semibold text-gray-700">🗒 Änderungsprotokoll</h2>
        <span className="text-gray-400 text-xs">{isOpen ? '▲ Schließen' : '▼ Öffnen'}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5">
          {isLoading && (
            <p className="text-sm text-gray-400 py-4 text-center">Lade Protokoll…</p>
          )}
          {error && (
            <p className="text-sm text-red-600 py-4">{error}</p>
          )}
          {!isLoading && !error && logs.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">Keine Einträge vorhanden.</p>
          )}
          {!isLoading && !error && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="text-left py-2 pr-4 font-medium">Datum</th>
                    <th className="text-left py-2 pr-4 font-medium">Typ</th>
                    <th className="text-left py-2 pr-4 font-medium">Kategorie</th>
                    <th className="text-left py-2 pr-4 font-medium">Aktion</th>
                    <th className="text-left py-2 pr-4 font-medium">Alt</th>
                    <th className="text-left py-2 pr-4 font-medium">Neu</th>
                    <th className="text-left py-2 pr-4 font-medium">Quelle</th>
                    <th className="text-left py-2 font-medium">Dokument</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-1.5 pr-4 text-gray-700">{log.entityType}</td>
                      <td className="py-1.5 pr-4 font-mono text-gray-600">
                        {parseCategory(log.metadata)}
                      </td>
                      <td className="py-1.5 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ACTION_STYLES[log.action] ?? ''}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-1.5 pr-4 text-gray-500">{log.oldValue ?? '—'}</td>
                      <td className="py-1.5 pr-4 text-gray-800">{log.newValue ?? '—'}</td>
                      <td className="py-1.5 pr-4 text-gray-500 uppercase text-xs">
                        {log.inputMethod}
                      </td>
                      <td className="py-1.5">
                        {log.document ? (
                          <a
                            href={`/api/documents/${log.document.id}`}
                            className="text-brand-green underline hover:no-underline"
                            download={log.document.filename}
                          >
                            📎 {log.document.filename}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
