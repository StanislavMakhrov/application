import Link from 'next/link';
import { RegisterForm } from '@/components/forms/RegisterForm';

export const metadata = { title: 'Registrieren – GrünBilanz' };

/**
 * Registration page for new GrünBilanz users.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <span className="text-white text-2xl">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-green-900">GrünBilanz</h1>
          <p className="text-green-700 mt-1">CO₂-Bilanz für Ihren Betrieb</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Konto erstellen</h2>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-gray-600">
            Bereits registriert?{' '}
            <Link href="/login" className="text-green-600 font-medium hover:text-green-700">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
