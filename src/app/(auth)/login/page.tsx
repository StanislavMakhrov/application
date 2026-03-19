import Link from 'next/link';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata = { title: 'Anmelden – GrünBilanz' };

/**
 * Login page for GrünBilanz.
 * Displays a login form and link to registration.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <span className="text-white text-2xl">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-green-900">GrünBilanz</h1>
          <p className="text-green-700 mt-1">CO₂-Fußabdruck für Handwerksbetriebe</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Anmelden</h2>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-gray-600">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-green-600 font-medium hover:text-green-700">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
