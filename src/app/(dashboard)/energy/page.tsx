'use client';

/**
 * Energy data entry page.
 *
 * Users enter their annual energy consumption (Strom, Erdgas, Diesel, Heizöl)
 * for a given year. On submission the server action calculates and stores the
 * CO₂ footprint, then redirects to the results page.
 */
import { useFormState, useFormStatus } from 'react-dom';
import { energyAction } from './actions';
import type { EnergyActionState } from './actions';

const currentYear = new Date().getFullYear();
const initialState: EnergyActionState = {};

export default function EnergyPage() {
  const [state, formAction] = useFormState(energyAction, initialState);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Energieverbrauch eingeben</h1>
        <p className="text-gray-600 mt-2">
          Geben Sie Ihren jährlichen Energieverbrauch ein. Die CO₂-Berechnung erfolgt nach
          GHG-Protokoll Scope 1 &amp; 2 mit UBA-Emissionsfaktoren 2024.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form action={formAction} className="space-y-6">
          {/* Berichtsjahr */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Berichtsjahr
            </label>
            <input
              id="year"
              name="year"
              type="number"
              min={2000}
              max={2100}
              defaultValue={currentYear}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {state.errors?.year && (
              <p className="text-red-600 text-xs mt-1">{state.errors.year[0]}</p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Scope 2 */}
          <div>
            <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
              Scope 2 — Strom (indirekte Emissionen)
            </h3>
            <div>
              <label htmlFor="strom_kwh" className="block text-sm font-medium text-gray-700 mb-1">
                Strom <span className="text-gray-400 font-normal">kWh/Jahr</span>
              </label>
              <input
                id="strom_kwh"
                name="strom_kwh"
                type="number"
                min={0}
                step={1}
                defaultValue={0}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. 15000"
              />
              {state.errors?.strom_kwh && (
                <p className="text-red-600 text-xs mt-1">{state.errors.strom_kwh[0]}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Scope 1 */}
          <div>
            <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wide mb-3">
              Scope 1 — Fossile Brennstoffe (direkte Emissionen)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Erdgas */}
              <div>
                <label
                  htmlFor="erdgas_m3"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Erdgas <span className="text-gray-400 font-normal">m³/Jahr</span>
                </label>
                <input
                  id="erdgas_m3"
                  name="erdgas_m3"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={0}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
                {state.errors?.erdgas_m3 && (
                  <p className="text-red-600 text-xs mt-1">{state.errors.erdgas_m3[0]}</p>
                )}
              </div>

              {/* Diesel */}
              <div>
                <label htmlFor="diesel_l" className="block text-sm font-medium text-gray-700 mb-1">
                  Diesel <span className="text-gray-400 font-normal">L/Jahr</span>
                </label>
                <input
                  id="diesel_l"
                  name="diesel_l"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={0}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
                {state.errors?.diesel_l && (
                  <p className="text-red-600 text-xs mt-1">{state.errors.diesel_l[0]}</p>
                )}
              </div>

              {/* Heizöl */}
              <div>
                <label
                  htmlFor="heizoel_l"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Heizöl <span className="text-gray-400 font-normal">L/Jahr</span>
                </label>
                <input
                  id="heizoel_l"
                  name="heizoel_l"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={0}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
                {state.errors?.heizoel_l && (
                  <p className="text-red-600 text-xs mt-1">{state.errors.heizoel_l[0]}</p>
                )}
              </div>
            </div>
          </div>

          {state.message && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {state.message}
            </p>
          )}

          <EnergySubmitButton />
        </form>
      </div>

      {/* Methodology note */}
      <p className="text-xs text-gray-400 text-center mt-4">
        Berechnung nach GHG-Protokoll Scope 1 &amp; 2 · Emissionsfaktoren: UBA 2024
      </p>
    </div>
  );
}

function EnergySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg transition-colors"
    >
      {pending ? 'CO₂ wird berechnet…' : 'CO₂-Fußabdruck berechnen →'}
    </button>
  );
}
