'use client';

/**
 * Onboarding page — collects company profile information.
 *
 * New users must complete this step before accessing the energy input form.
 * Stores Firmenname, Branche, Mitarbeiterzahl and Standort via a Server Action.
 */
import { useFormState, useFormStatus } from 'react-dom';
import { BRANCHEN } from '@/lib/benchmarks';
import { onboardingAction } from './actions';
import type { OnboardingActionState } from './actions';

const initialState: OnboardingActionState = {};

export default function OnboardingPage() {
  const [state, formAction] = useFormState(onboardingAction, initialState);

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Betrieb einrichten</h1>
        <p className="text-gray-600 mt-2">
          Bitte geben Sie die Basisdaten Ihres Betriebs ein. Diese werden für den
          Branchenvergleich benötigt.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form action={formAction} className="space-y-5">
          {/* Firmenname */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Firmenname
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Muster GmbH"
            />
            {state.errors?.name && (
              <p className="text-red-600 text-xs mt-1">{state.errors.name[0]}</p>
            )}
          </div>

          {/* Branche */}
          <div>
            <label htmlFor="branche" className="block text-sm font-medium text-gray-700 mb-1">
              Branche
            </label>
            <select
              id="branche"
              name="branche"
              required
              defaultValue=""
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              {BRANCHEN.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {state.errors?.branche && (
              <p className="text-red-600 text-xs mt-1">{state.errors.branche[0]}</p>
            )}
          </div>

          {/* Mitarbeiter */}
          <div>
            <label htmlFor="mitarbeiter" className="block text-sm font-medium text-gray-700 mb-1">
              Anzahl Mitarbeiter
            </label>
            <input
              id="mitarbeiter"
              name="mitarbeiter"
              type="number"
              min={1}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="10"
            />
            {state.errors?.mitarbeiter && (
              <p className="text-red-600 text-xs mt-1">{state.errors.mitarbeiter[0]}</p>
            )}
          </div>

          {/* Standort */}
          <div>
            <label htmlFor="standort" className="block text-sm font-medium text-gray-700 mb-1">
              Standort (PLZ oder Stadt)
            </label>
            <input
              id="standort"
              name="standort"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="München"
            />
            {state.errors?.standort && (
              <p className="text-red-600 text-xs mt-1">{state.errors.standort[0]}</p>
            )}
          </div>

          {state.message && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {state.message}
            </p>
          )}

          <SubmitButton label="Weiter →" pendingLabel="Wird gespeichert…" />
        </form>
      </div>
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg transition-colors"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
