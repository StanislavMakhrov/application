/**
 * Register page — new account creation via Supabase email + password.
 * Uses a Client Component for form interactivity.
 */
import RegisterForm from '@/components/forms/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">Konto erstellen</h2>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        Bereits ein Konto?{' '}
        <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
          Hier anmelden
        </Link>
      </p>
    </div>
  );
}
