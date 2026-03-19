'use client';

/**
 * Signup form — new user registration via Supabase email/password auth.
 * Validates password confirmation client-side before sending to Supabase.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const signupSchema = z
  .object({
    email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein.'),
    password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein.',
    path: ['confirmPassword'],
  });

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Diese E-Mail-Adresse ist bereits registriert.');
        } else {
          setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        }
        return;
      }

      // Supabase may require email confirmation depending on project settings
      setSuccessMessage(
        'Registrierung erfolgreich! Bitte überprüfen Sie Ihr E-Mail-Postfach, um Ihr Konto zu bestätigen.',
      );
      // If email confirmation is disabled, redirect directly
      setTimeout(() => router.push('/onboarding'), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Konto erstellen</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="name@betrieb.de"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Mindestens 8 Zeichen"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          {loading ? 'Registrieren…' : 'Konto erstellen'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Bereits ein Konto?{' '}
        <Link href="/login" className="text-green-700 hover:text-green-800 font-medium underline">
          Jetzt anmelden
        </Link>
      </p>
    </div>
  );
}
