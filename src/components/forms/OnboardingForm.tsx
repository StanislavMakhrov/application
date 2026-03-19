'use client';

/**
 * OnboardingForm — company profile form (Firmenname, Branche, Mitarbeiter, Standort).
 *
 * Submitted data is passed to the `saveCompany` Server Action.
 * On success the user is redirected to /energy to enter energy data.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRANCHEN, type Branche } from '@/lib/benchmarks';

interface OnboardingFormProps {
  /** Existing company data pre-populates the form (edit mode) */
  initialData?: {
    name: string;
    branche: Branche;
    mitarbeiter: number;
    standort: string;
  };
  /** Server action to call on submit */
  saveCompany: (formData: FormData) => Promise<{ error?: string }>;
}

export default function OnboardingForm({ initialData, saveCompany }: OnboardingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await saveCompany(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Navigate to energy input after successful onboarding
    router.push('/energy');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Firmenname */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Firmenname
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialData?.name ?? ''}
          placeholder="z. B. Müller Elektrotechnik GmbH"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* Branche */}
      <div>
        <label htmlFor="branche" className="block text-sm font-medium text-gray-700">
          Branche
        </label>
        <select
          id="branche"
          name="branche"
          required
          defaultValue={initialData?.branche ?? ''}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="" disabled>
            Branche wählen…
          </option>
          {BRANCHEN.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Mitarbeiter */}
      <div>
        <label htmlFor="mitarbeiter" className="block text-sm font-medium text-gray-700">
          Anzahl Mitarbeiter
        </label>
        <input
          id="mitarbeiter"
          name="mitarbeiter"
          type="number"
          required
          min={1}
          max={9999}
          defaultValue={initialData?.mitarbeiter ?? ''}
          placeholder="z. B. 12"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* Standort */}
      <div>
        <label htmlFor="standort" className="block text-sm font-medium text-gray-700">
          Standort (Stadt / PLZ)
        </label>
        <input
          id="standort"
          name="standort"
          type="text"
          required
          defaultValue={initialData?.standort ?? ''}
          placeholder="z. B. München"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Wird gespeichert…' : 'Speichern und weiter'}
      </button>
    </form>
  );
}
