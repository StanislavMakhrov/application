/**
 * Multi-step input wizard for GrünBilanz.
 * Client component that walks users through entering Scope 1, 2, and 3 emission data.
 * Includes OCR upload functionality for pre-filling values from documents.
 */

'use client';

import { useState } from 'react';
import Scope1Form from './Scope1Form';
import Scope2Form from './Scope2Form';
import Scope3Form from './Scope3Form';

interface EmissionFactor {
  id: number;
  year: number;
  category: string;
  subcategory: string | null;
  factorKgCo2ePerUnit: number;
  unit: string;
  source: string;
  validFrom?: string; // ISO string when serialized from server component
}

interface ExistingEntry {
  scope: string;
  category: string;
  subcategory: string | null;
  quantity: number;
  unit: string;
  co2e: number;
}

interface InputWizardProps {
  periodId: number;
  year: number;
  factors: EmissionFactor[];
  existingEntries: ExistingEntry[];
}

const STEPS = [
  { id: 1, label: 'Scope 1', description: 'Direkte Emissionen' },
  { id: 2, label: 'Scope 2', description: 'Eingekaufte Energie' },
  { id: 3, label: 'Scope 3', description: 'Wertschöpfungskette' },
];

export default function InputWizard({ periodId, year, factors, existingEntries }: InputWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set());
  const [ocrText, setOcrText] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState(false);

  /** Handle OCR file upload — forwards to /api/ocr and sets extracted text */
  async function handleOcrUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ocr', { method: 'POST', body: formData });
      const result = await response.json();

      if (result.text) {
        setOcrText(result.text);
        alert(
          `OCR erfolgreich! ${result.text.length} Zeichen erkannt.\n\nExtrahierter Text wurde für die Formularfelder bereitgestellt.`
        );
      } else {
        alert('OCR-Fehler: ' + (result.error ?? 'Unbekannter Fehler'));
      }
    } catch {
      alert('OCR-Service nicht erreichbar.');
    } finally {
      setOcrLoading(false);
    }
  }

  function markStepSaved(step: number) {
    setSavedSteps((prev) => { const next = new Set(Array.from(prev)); next.add(step); return next; });
  }

  const isLastStep = currentStep === STEPS.length;

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentStep === step.id
                  ? 'bg-green-600 text-white'
                  : savedSteps.has(step.id)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {savedSteps.has(step.id) ? (
                <span className="text-xs">✓</span>
              ) : (
                <span className="text-xs">{step.id}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <span className="text-gray-300 text-xs">›</span>
            )}
          </div>
        ))}
      </div>

      {/* Step description */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {STEPS[currentStep - 1].label} – {STEPS[currentStep - 1].description}
        </h2>
      </div>

      {/* OCR upload — available on all steps */}
      <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-green-800">OCR-Upload</p>
            <p className="text-xs text-green-600">
              Rechnung oder Abrechnung hochladen — Werte werden automatisch erkannt
            </p>
          </div>
          <label
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              ocrLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {ocrLoading ? 'Erkenne...' : '📄 Datei hochladen'}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleOcrUpload}
              disabled={ocrLoading}
            />
          </label>
        </div>
        {ocrText && (
          <details className="mt-2">
            <summary className="text-xs text-green-700 cursor-pointer">
              OCR-Text anzeigen ({ocrText.length} Zeichen)
            </summary>
            <pre className="mt-1 text-xs bg-white border border-green-100 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-gray-600">
              {ocrText}
            </pre>
          </details>
        )}
      </div>

      {/* Step forms */}
      {currentStep === 1 && (
        <Scope1Form
          periodId={periodId}
          year={year}
          factors={factors.filter((f) =>
            ['Erdgas', 'Dieselkraftstoff', 'Heizöl'].includes(f.category)
          )}
          existingEntries={existingEntries.filter((e) => e.scope === 'SCOPE1')}
          onSaved={() => {
            markStepSaved(1);
            setCurrentStep(2);
          }}
        />
      )}
      {currentStep === 2 && (
        <Scope2Form
          periodId={periodId}
          year={year}
          factors={factors.filter((f) =>
            ['Strom', 'Fernwärme'].includes(f.category)
          )}
          existingEntries={existingEntries.filter((e) => e.scope === 'SCOPE2')}
          onSaved={() => {
            markStepSaved(2);
            setCurrentStep(3);
          }}
        />
      )}
      {currentStep === 3 && (
        <Scope3Form
          periodId={periodId}
          year={year}
          factors={factors.filter((f) =>
            ['Flug', 'Pkw', 'Bahn', 'Abfall'].includes(f.category)
          )}
          existingEntries={existingEntries.filter((e) => e.scope === 'SCOPE3')}
          onSaved={() => {
            markStepSaved(3);
          }}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Zurück
        </button>

        {isLastStep && savedSteps.has(3) ? (
          <a
            href="/dashboard"
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Zum Dashboard →
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}
            disabled={isLastStep}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Weiter →
          </button>
        )}
      </div>
    </div>
  );
}
