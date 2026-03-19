'use client';

/**
 * RegisterForm — new account creation with email + password.
 *
 * After successful registration Supabase sends a confirmation email.
 * The user is shown a success message and directed to check their inbox.
 */
import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError('Registrierung fehlgeschlagen: ' + authError.message);
      setLoading(false);
      return;
    }

    // Supabase sends a confirmation email; we show a success message instead of auto-redirecting
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
        <p className="font-semibold">Registrierung erfolgreich! 🎉</p>
        <p className="mt-1">
          Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen einen Link an{' '}
          <strong>{email}</strong> gesendet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Passwort <span className="text-gray-400">(min. 8 Zeichen)</span>
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {loading ? 'Wird registriert…' : 'Registrieren'}
      </button>
    </form>
  );
}
