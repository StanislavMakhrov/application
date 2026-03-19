'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { BRANCHEN } from '@/types';
import type { Company } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Firmenname muss mindestens 2 Zeichen haben').max(100),
  branche: z.string().min(1, 'Bitte wählen Sie eine Branche'),
  mitarbeiter: z.number().int().min(1, 'Mindestens 1 Mitarbeiter').max(10000),
  standort: z.string().min(2, 'Bitte geben Sie den Standort ein').max(100),
});

interface OnboardingFormProps {
  existingCompany: Company | null;
}

/**
 * Company profile form for the onboarding step.
 * Pre-fills with existing data if available (edit mode).
 */
export function OnboardingForm({ existingCompany }: OnboardingFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: existingCompany?.name ?? '',
    branche: existingCompany?.branche ?? '',
    mitarbeiter: existingCompany?.mitarbeiter?.toString() ?? '1',
    standort: existingCompany?.standort ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = schema.safeParse({
      ...formData,
      mitarbeiter: parseInt(formData.mitarbeiter, 10),
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Ungültige Eingabe');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Speichern');
        return;
      }

      router.push('/energy');
    } catch {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Firmenname *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          placeholder="Muster Elektro GmbH"
        />
      </div>

      <div>
        <label htmlFor="branche" className="block text-sm font-medium text-gray-700 mb-1">
          Branche *
        </label>
        <select
          id="branche"
          name="branche"
          value={formData.branche}
          onChange={handleChange}
          required
          className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
        >
          <option value="">Bitte wählen…</option>
          {BRANCHEN.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mitarbeiter" className="block text-sm font-medium text-gray-700 mb-1">
          Anzahl Mitarbeiter *
        </label>
        <input
          id="mitarbeiter"
          name="mitarbeiter"
          type="number"
          min="1"
          max="10000"
          value={formData.mitarbeiter}
          onChange={handleChange}
          required
          className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div>
        <label htmlFor="standort" className="block text-sm font-medium text-gray-700 mb-1">
          Standort (Stadt/PLZ) *
        </label>
        <input
          id="standort"
          name="standort"
          type="text"
          value={formData.standort}
          onChange={handleChange}
          required
          className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          placeholder="Berlin"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Speichern…' : existingCompany ? 'Änderungen speichern' : 'Weiter zu Energiedaten →'}
        </button>
      </div>
    </form>
  );
}
