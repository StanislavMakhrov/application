/**
 * Shared layout for authentication pages (login, register).
 *
 * Provides a centred, gradient background container suitable for forms
 * and displays the GrünBilanz branding.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">🌱 GrünBilanz</h1>
          <p className="text-green-600 mt-2">CO₂ Fußabdruck für Handwerksbetriebe</p>
        </div>
        {children}
      </div>
    </div>
  );
}
