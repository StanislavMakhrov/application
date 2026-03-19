/**
 * Auth layout — shared wrapper for login and register pages.
 * Centers the form card on screen with the GrünBilanz brand header.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-12">
      {/* Brand header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-green-700">🌿 GrünBilanz</h1>
        <p className="mt-1 text-sm text-gray-500">CO₂-Fußabdruck für Handwerksbetriebe</p>
      </div>
      {children}
    </div>
  );
}
