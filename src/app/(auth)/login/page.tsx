/**
 * Login page — email + password authentication via Supabase.
 * Uses a Client Component for form interactivity.
 */
import LoginForm from '@/components/forms/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">Anmelden</h2>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        Noch kein Konto?{' '}
        <Link href="/register" className="font-medium text-green-600 hover:text-green-700">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
