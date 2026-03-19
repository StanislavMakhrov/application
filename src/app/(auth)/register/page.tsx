'use client';

/**
 * Registration page — allows new users to create an account.
 *
 * Uses Supabase signUp. On success, shows a confirmation message asking
 * the user to verify their e-mail. All copy is in German.
 */
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
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
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Bestätigung erforderlich</h2>
        <p className="text-gray-600 mb-6">
          Wir haben eine Bestätigungs-E-Mail an <strong>{email}</strong> gesendet. Bitte klicken
          Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
        </p>
        <Link
          href="/login"
          className="inline-block bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
        >
          Zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Konto erstellen</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="max@muster.de"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Passwort <span className="text-gray-400 font-normal">(mind. 8 Zeichen)</span>
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Bereits registriert?{' '}
        <Link href="/login" className="text-green-700 hover:text-green-800 font-medium">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
