'use client';

/**
 * Login page — allows existing users to sign in with email and password.
 *
 * Uses Supabase signInWithPassword. On success, redirects to the energy
 * input page. Error messages are displayed in German per UX requirements.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('E-Mail-Adresse oder Passwort ist falsch.');
      setLoading(false);
      return;
    }

    router.push('/energy');
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Anmelden</h2>

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
            Passwort
          </label>
          <input
            id="password"
            type="password"
            required
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
          {loading ? 'Anmelden…' : 'Anmelden'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-green-700 hover:text-green-800 font-medium">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
