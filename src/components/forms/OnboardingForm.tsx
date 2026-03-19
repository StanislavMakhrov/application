'use client';

/**
 * Onboarding form — collect company profile data for new users.
 * Saves to Supabase `companies` table and redirects to /energy on success.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { BRANCHEN } from '@/lib/benchmarks';
import { createCompany } from '@/services/companies';

interface OnboardingFormProps {
  userId: string;
}

const onboardingSchema = z.object({
  name: z.string().min(2, 'Unternehmensname muss mindestens 2 Zeichen lang sein.'),
  branche: z.enum(BRANCHEN, {
    errorMap: () => ({ message: 'Bitte wählen Sie eine Branche aus.' }),
  }),
  mitarbeiter: z
    .number({ invalid_type_error: 'Bitte geben Sie eine Zahl ein.' })
    .int()
    .min(1, 'Mindestens 1 Mitarbeiter.')
    .max(500, 'Maximal 500 Mitarbeiter.'),
  standort: z.string().min(2, 'Bitte geben Sie einen Standort ein.'),
});

export default function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [branche, setBranche] = useState('');
  const [mitarbeiter, setMitarbeiter] = useState('');
  const [standort, setStandort] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = onboardingSchema.safeParse({
      name,
      branche,
      mitarbeiter: parseInt(mitarbeiter, 10),
      standort,
    });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const company = await createCompany({
        user_id: userId,
        ...result.data,
      });

      if (!company) {
        setError('Unternehmen konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.');
        return;
      }

      router.push('/energy');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Unternehmensname <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Muster Elektriker GmbH"
          />
        </div>

        <div>
          <label htmlFor="branche" className="block text-sm font-medium text-gray-700 mb-1">
            Branche <span className="text-red-500">*</span>
          </label>
          <select
            id="branche"
            value={branche}
            onChange={(e) => setBranche(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value="">Bitte wählen…</option>
            {BRANCHEN.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mitarbeiter" className="block text-sm font-medium text-gray-700 mb-1">
            Anzahl Mitarbeiter <span className="text-red-500">*</span>
          </label>
          <input
            id="mitarbeiter"
            type="number"
            value={mitarbeiter}
            onChange={(e) => setMitarbeiter(e.target.value)}
            required
            min={1}
            max={500}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="5"
          />
        </div>

        <div>
          <label htmlFor="standort" className="block text-sm font-medium text-gray-700 mb-1">
            Standort (Stadt) <span className="text-red-500">*</span>
          </label>
          <input
            id="standort"
            type="text"
            value={standort}
            onChange={(e) => setStandort(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="München"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          {loading ? 'Speichern…' : 'Weiter zu Energiedaten →'}
        </button>
      </form>
    </div>
  );
}
