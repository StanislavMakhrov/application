/**
 * Signup page — new user registration.
 * Renders the SignupForm client component with GrünBilanz branding.
 */
import SignupForm from '@/components/forms/SignupForm';

export const metadata = {
  title: 'Registrieren – GrünBilanz',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Green branding header */}
      <header className="bg-green-600 text-white py-4 px-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">🌿 GrünBilanz</h1>
        <p className="text-green-100 text-sm mt-1">
          CO₂-Fußabdruck für Handwerksbetriebe
        </p>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
