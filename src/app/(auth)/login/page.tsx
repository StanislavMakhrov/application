/**
 * Login page — entry point for returning users.
 * Renders the LoginForm client component with GrünBilanz branding.
 */
import LoginForm from '@/components/forms/LoginForm';

export const metadata = {
  title: 'Anmelden – GrünBilanz',
};

export default function LoginPage() {
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
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
