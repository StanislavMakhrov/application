'use client';

/**
 * Collapsible Methodik section for the dashboard report view.
 *
 * Shows methodology details auto-generated from the reporting year data.
 * Rendered as a client component because it requires toggle state.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MethodologyData } from '@/types';

interface MethodologySectionProps {
  methodology: MethodologyData;
}

export function MethodologySection({ methodology: m }: MethodologySectionProps) {
  const [open, setOpen] = useState(false);

  const dataQualityText =
    m.dataQuality.total === 0
      ? 'Nicht erfasst — alle Werte werden als manuell erfasst behandelt.'
      : [
          m.dataQuality.manual > 0 ? `${m.dataQuality.manual} manuell erfasst` : null,
          m.dataQuality.ocrExtracted > 0 ? `${m.dataQuality.ocrExtracted} OCR-extrahiert` : null,
          m.dataQuality.estimated > 0 ? `${m.dataQuality.estimated} geschätzt` : null,
        ]
          .filter(Boolean)
          .join(' · ');

  const boundaryText =
    m.boundary.companyName
      ? [
          m.boundary.companyName,
          String(m.boundary.reportingYear),
          m.boundary.employees != null ? `${m.boundary.employees} Mitarbeitende` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Unternehmensprofil: Nicht konfiguriert';

  return (
    <div className="bg-white rounded-card border border-card-border shadow-card overflow-hidden mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-700">Methodik</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <dl className="mt-4 grid grid-cols-1 gap-y-3 text-sm">
            <div>
              <dt className="font-semibold text-gray-600">Berechnungsstandard</dt>
              <dd className="text-gray-800 mt-0.5">{m.standard}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Emissionsfaktoren</dt>
              <dd className="text-gray-800 mt-0.5">
                {m.factorSet.name} · {m.factorSet.source} · {m.factorSet.year}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Enthaltene Scopes</dt>
              <dd className="text-gray-800 mt-0.5 space-y-0.5">
                {m.scopesCovered.scope1.length > 0 && (
                  <div><span className="font-medium">Scope 1:</span> {m.scopesCovered.scope1.join(', ')}</div>
                )}
                {m.scopesCovered.scope2.length > 0 && (
                  <div><span className="font-medium">Scope 2:</span> {m.scopesCovered.scope2.join(', ')}</div>
                )}
                {m.scopesCovered.scope3.length > 0 && (
                  <div><span className="font-medium">Scope 3:</span> {m.scopesCovered.scope3.join(', ')}</div>
                )}
                {m.scopesCovered.scope1.length === 0 && m.scopesCovered.scope2.length === 0 && m.scopesCovered.scope3.length === 0 && (
                  <span className="text-gray-400">Keine Emissionsdaten erfasst.</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Datenqualität</dt>
              <dd className="text-gray-800 mt-0.5">{dataQualityText}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Berichtsrahmen</dt>
              <dd className="text-gray-800 mt-0.5">{boundaryText}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Annahmen und Ausschlüsse</dt>
              <dd className="text-gray-800 mt-0.5">
                {m.assumptions ?? 'Keine Annahmen oder Ausschlüsse dokumentiert.'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Berechnungsversion</dt>
              <dd className="text-gray-800 mt-0.5">GrünBilanz v{m.engineVersion}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
